'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { WorkshopDataResponse, Job, JobTask } from './types';
import { VehicleInstalledComponent, Order } from '@/features/parts/types';
import { vercelGateway } from '@/lib/ai-gateway';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { SkillLevel } from '@repo/types';

export async function getWorkshopData(vehicleId: string): Promise<WorkshopDataResponse | { error: string }> {
    const supabase = await createClient();

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return { error: 'Unauthorized' };

        // 1. Fetch Inventory (wishlist & right now available parts)
        const { data: inventoryData, error: inventoryError } = await supabase
            .from('inventory')
            .select(`
        *,
        master_part:master_parts (
           id,
           name,
           part_number,
           affiliate_url,
           category
         )
      `)
            .eq('vehicle_id', vehicleId)
            .in('status', ['wishlist', 'in_stock', 'ordered']);

        if (inventoryError) {
            console.error('Error fetching inventory:', inventoryError);
            return { error: 'Failed to fetch inventory' };
        }

        // 2. Fetch Jobs (planned & in_progress)
        const { data: jobsData, error: jobsError } = await supabase
            .from('jobs')
            .select(`
        *,
        tasks:job_tasks(*),
        job_tasks(*),
        job_parts:job_parts(
            inventory_id,
            qty_used,
            inventory:inventory(*)
        ),
        tools:job_tools(*),
        specs:job_specs(*)
      `)
            .eq('vehicle_id', vehicleId)
            .in('status', ['planned', 'in_progress'])
            .order('order_index', { ascending: true })
            .order('created_at', { ascending: false });

        if (jobsError) {
            console.error('Error fetching jobs:', jobsError);
            return { error: 'Failed to fetch jobs' };
        }

        const formattedJobs: Job[] = jobsData.map((job: any) => {
            // Fallback to un-aliased job_tasks if alias is empty/missing
            const rawTasks = (job.tasks && job.tasks.length > 0) ? job.tasks : (job.job_tasks || []);

            return {
                ...job,
                tasks: rawTasks.sort((a: any, b: any) => a.order_index - b.order_index),
                parts: job.job_parts?.map((jp: any) => jp.inventory) || []
            };
        });


        // 3. Fetch Orders
        const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .eq('vehicle_id', vehicleId)
            .order('created_at', { ascending: false });

        if (ordersError) {
            console.error('Error fetching orders:', ordersError);
            // Don't fail the whole request, just log it.
        }

        return {
            inventory: inventoryData as unknown as VehicleInstalledComponent[],
            jobs: formattedJobs,
            orders: ordersData || []
        };

    } catch (err) {
        console.error('Unexpected error in getWorkshopData:', err);
        return { error: 'Internal server error' };
    }
}

export async function purchasePart(inventoryId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { error } = await supabase
        .from('inventory')
        .update({ status: 'in_stock' })
        .eq('id', inventoryId)
        .eq('user_id', user.id);

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true };
}

export async function markPartArrived(inventoryId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Fetch the part first to get its order_id
    const { data: part } = await supabase
        .from('inventory')
        .select('order_id')
        .eq('id', inventoryId)
        .eq('user_id', user.id)
        .single();

    const { error } = await supabase
        .from('inventory')
        .update({
            status: 'in_stock',
            tracking_number: null,
            carrier: null
        })
        .eq('id', inventoryId)
        .eq('user_id', user.id);

    if (error) return { error: error.message };

    // If part was linked to an order, check if the order is now empty
    if (part?.order_id) {
        const { data: remainingParts } = await supabase
            .from('inventory')
            .select('id')
            .eq('order_id', part.order_id)
            .in('status', ['ordered', 'wishlist'])
            .limit(1);

        // No more pending parts — mark the order as delivered
        if (!remainingParts || remainingParts.length === 0) {
            await supabase
                .from('orders')
                .update({ status: 'delivered' })
                .eq('id', part.order_id);
        }
    }

    revalidatePath('/vehicle');
    return { success: true };
}

export async function createJob(vehicleId: string, title: string, description?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Get max order index
    const { data: maxJob } = await supabase
        .from('jobs')
        .select('order_index')
        .eq('vehicle_id', vehicleId)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();
    
    const newOrderIndex = (maxJob?.order_index ?? 0) + 1;

    const { data, error } = await supabase
        .from('jobs')
        .insert({
            vehicle_id: vehicleId,
            user_id: user.id,
            title: title,
            notes: description,
            status: 'planned',
            order_index: newOrderIndex,
            created_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true, job: data };
}

export async function addPartToJob(jobId: string, inventoryId: string, qty: number = 1) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 0. Check job plan_status to gate part additions
    const { data: job } = await supabase
        .from('jobs')
        .select('plan_status')
        .eq('id', jobId)
        .single();

    // 1. Fetch current item details
    const { data: item, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', inventoryId)
        .single();

    if (fetchError || !item) return { error: 'Part not found' };

    // Plan status gate: ready/active jobs only accept in_stock parts
    const planStatus = job?.plan_status || 'draft';
    if (planStatus !== 'draft' && item.status !== 'in_stock') {
        return { error: 'Only parts that have arrived (in stock) can be added to a finalized plan.' };
    }

    const currentQty = item.quantity || 1;
    let finalInventoryId = inventoryId;

    // 2. Handle Split if needed
    if (qty < currentQty && qty > 0) {
        // Decrement original
        const { error: updateError } = await supabase
            .from('inventory')
            .update({ quantity: currentQty - qty })
            .eq('id', inventoryId);

        if (updateError) return { error: 'Failed to update inventory quantity' };

        // Create new item (clone)
        // We exclude 'id', 'created_at' and 'updated_at' usually, but here we just copy fields manually or carefully
        const { data: newItem, error: createError } = await supabase
            .from('inventory')
            .insert({
                user_id: item.user_id,
                vehicle_id: item.vehicle_id,
                name: item.name,
                category: item.category,
                part_number: item.part_number,
                purchase_url: item.purchase_url,
                purchase_price: item.purchase_price,
                status: item.status, // Keep same status (e.g. in_stock)
                lifespan_miles: item.lifespan_miles,
                lifespan_months: item.lifespan_months,
                purchased_at: item.purchased_at,
                quantity: qty
            })
            .select()
            .single();

        if (createError) return { error: 'Failed to split inventory item' };
        finalInventoryId = newItem.id;
    }

    // 3. Link to Job
    const { error } = await supabase
        .from('job_parts')
        .insert({
            job_id: jobId,
            inventory_id: finalInventoryId,
            qty_used: qty
        });

    if (error) return { error: error.message };

    revalidatePath('/vehicle');
    return { success: true };
}

export async function startJob(jobId: string) {
    const supabase = await createClient();

    // Fetch job to check plan_status
    const { data: job } = await supabase
        .from('jobs')
        .select('plan_status')
        .eq('id', jobId)
        .single();

    const planStatus = job?.plan_status || 'draft';

    // If still in draft, auto-transition to ready first (validates parts)
    if (planStatus === 'draft') {
        const readiness = await checkJobReadiness(jobId);
        if ('error' in readiness) return readiness;
        if (!readiness.ready) {
            const issues: string[] = [];
            if (readiness.missingParts.length > 0) {
                issues.push(`${readiness.missingParts.length} part(s) not in stock`);
            }
            if (readiness.missingTools.length > 0) {
                issues.push(`${readiness.missingTools.length} tool(s) not acquired`);
            }
            return { error: `Job not ready to start. ${issues.join(', ')}.` };
        }
    }

    const { error } = await supabase
        .from('jobs')
        .update({ status: 'in_progress', plan_status: 'active' })
        .eq('id', jobId);

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true };
}

export async function completeJob(jobId: string, odometer: number) {
    const supabase = await createClient();

    // 1. Mark job complete
    const { error: jobError } = await supabase
        .from('jobs')
        .update({
            status: 'completed',
            date_completed: new Date().toISOString(),
            odometer
        })
        .eq('id', jobId);

    if (jobError) return { error: jobError.message };

    // 2. Find all parts linked to this job and mark them installed
    // We need to fetch them first or do a subquery update if supported, but simpler to just do two steps if low volume.
    // Or utilize the foreign keys.

    const { data: jobParts } = await supabase
        .from('job_parts')
        .select('inventory_id')
        .eq('job_id', jobId);

    if (jobParts && jobParts.length > 0) {
        const inventoryIds = jobParts.map(jp => jp.inventory_id);

        // Robust update: Set status to installed.
        // We rely on 'category' being correct on the inventory item.
        // If it's a custom part, it was set on creation.
        // If it's a master part, it was set on creation (addPartToVehicle).
        const { error: updateError } = await supabase
            .from('inventory')
            .update({
                status: 'installed',
                installed_at: new Date().toISOString(),
                install_miles: odometer
            })
            .in('id', inventoryIds);

        if (updateError) {
            console.error('[completeJob] Failed to update parts status:', updateError);
            return { error: `Failed to update parts: ${updateError.message}` };
        }
    }

    // 3. Update vehicle odometer if new value is higher
    // (Optional but good practice, though user_vehicle.odometer usually updated via specialized actions)
    // We'll leave user_vehicle explicit update to separate logic if needed, but for now let's just update it.
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        // Fetch job to get vehicle_id
        const { data: job } = await supabase.from('jobs').select('vehicle_id').eq('id', jobId).single();
        if (job) {
            await supabase
                .from('user_vehicle')
                .update({ odometer })
                .eq('id', job.vehicle_id)
                .lt('odometer', odometer); // Only update if higher
        }
    }

    revalidatePath('/vehicle');
    return { success: true };
}

export async function updateJobTask(taskId: string, field: 'is_done_tear' | 'is_done_build', value: boolean) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('job_tasks')
        .update({ [field]: value })
        .eq('id', taskId);

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true };
}

export async function createJobTask(jobId: string, instruction: string, phase: 'teardown' | 'assembly' = 'teardown') {
    const supabase = await createClient();

    // Get max order index for this phase
    const { data: maxOrder } = await supabase
        .from('job_tasks')
        .select('order_index')
        .eq('job_id', jobId)
        .eq('phase', phase)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

    const newIndex = (maxOrder?.order_index || 0) + 1;

    const { data, error } = await supabase
        .from('job_tasks')
        .insert({
            job_id: jobId,
            instruction,
            phase,
            order_index: newIndex
        })
        .select()
        .single();

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true, task: data };
}

export async function updateJobTaskContent(taskId: string, instruction: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('job_tasks')
        .update({ instruction })
        .eq('id', taskId);

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true };
}

export async function addCustomPartToJob(jobId: string, vehicleId: string, partData: {
    name: string;
    category?: string;
    partNumber?: string;
    vendorLink?: string;
    cost?: number;
    qty?: number;
    installedDate?: string;
    installedMileage?: number;
    lifespanMiles?: number;
    lifespanMonths?: number;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // 1. Create custom inventory item (wishlist status by default)
    const { data: inventoryItem, error: inventoryError } = await supabase
        .from('inventory')
        .insert({
            user_id: user.id,
            vehicle_id: vehicleId,
            name: partData.name,
            category: partData.category,
            part_number: partData.partNumber,
            purchase_url: partData.vendorLink,
            purchase_price: partData.cost, // Assuming cost is purchase_price
            status: 'wishlist',
            lifespan_miles: partData.lifespanMiles,
            lifespan_months: partData.lifespanMonths,
            installed_at: partData.installedDate,
            install_miles: partData.installedMileage,
            created_at: new Date().toISOString()
        })
        .select()
        .single();

    if (inventoryError) return { error: inventoryError.message };

    // 2. Link to job
    const { error: linkError } = await supabase
        .from('job_parts')
        .insert({
            job_id: jobId,
            inventory_id: inventoryItem.id,
            // qty_used: partData.qty // Assuming we have qty_used in job_parts
        });

    if (linkError) return { error: linkError.message };

    revalidatePath('/vehicle');
    return { success: true };
}

export async function removePartFromJob(jobId: string, inventoryId: string) {
    const supabase = await createClient();

    // Unlink the part
    const { error } = await supabase
        .from('job_parts')
        .delete()
        .eq('job_id', jobId)
        .eq('inventory_id', inventoryId);

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true };
}

export async function removeJobTask(taskId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('job_tasks')
        .delete()
        .eq('id', taskId);

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true };
}

export async function moveJobToPlanned(jobId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('jobs')
        .update({ status: 'planned', odometer: null, date_completed: null })
        .eq('id', jobId);

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true };
}

export async function deleteJob(jobId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true };
}

export async function updateJobOrder(jobs: { id: string; order_index: number }[]) {
    const supabase = await createClient();
    const updates = jobs.map(job => 
        supabase.from('jobs').update({ order_index: job.order_index }).eq('id', job.id)
    );
    await Promise.all(updates);
    revalidatePath('/vehicle');
    return { success: true };
    return { success: true };
}

export async function updateJobTaskOrder(tasks: { id: string; order_index: number }[]) {
    const supabase = await createClient();
    const updates = tasks.map(task => 
        supabase.from('job_tasks').update({ order_index: task.order_index }).eq('id', task.id)
    );
    await Promise.all(updates);
    revalidatePath('/vehicle');
    return { success: true };
}

// --- Tools Actions ---

export async function createJobTool(jobId: string, name: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job_tools')
        .insert({
            job_id: jobId,
            name,
            is_acquired: false,
            created_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true, tool: data };
}

export async function updateJobTool(toolId: string, updates: { is_acquired?: boolean; name?: string }) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('job_tools')
        .update(updates)
        .eq('id', toolId);

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true };
}

export async function deleteJobTool(toolId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('job_tools')
        .delete()
        .eq('id', toolId);

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true };
}

// --- Specs Actions ---

export async function createJobSpec(jobId: string, item: string, value: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job_specs')
        .insert({
            job_id: jobId,
            item,
            value,
            created_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true, spec: data };
}

export async function updateJobSpec(specId: string, updates: { item?: string; value?: string }) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('job_specs')
        .update(updates)
        .eq('id', specId);

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true };
}

export async function deleteJobSpec(specId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('job_specs')
        .delete()
        .eq('id', specId);

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true };
}

// --- Tool Inventory Sync ---

export async function addToolToUserInventory(toolName: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Get current inventory
    const { data: prefs } = await supabase
        .from('user_preferences')
        .select('tool_inventory')
        .eq('user_id', user.id)
        .single();

    let inventory = prefs?.tool_inventory || [];
    if (!Array.isArray(inventory)) inventory = [];

    // Check if already exists
    const exists = inventory.some((t: any) => 
        t.name.toLowerCase() === toolName.toLowerCase()
    );

    if (!exists) {
        inventory.push({ name: toolName, owned: true, suggested: false });
        
        const { error } = await supabase
            .from('user_preferences')
            .upsert({
                user_id: user.id,
                tool_inventory: inventory
            }, { onConflict: 'user_id' });

        if (error) return { error: error.message };
    }

    return { success: true };
}

export async function generateMissionPlan(jobId: string, partsList: string[]) {
    const supabase = await createClient();

    // 0. Get current user for preferences and check usage limits
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized - please log in' };

    // Check monthly usage limit (50 plans/month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const { count: monthlyUsage } = await supabase
        .from('ai_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('service', 'workshop_plan')
        .gte('created_at', startOfMonth.toISOString());
    
    if (monthlyUsage !== null && monthlyUsage >= 50) {
        return { error: 'Monthly AI plan limit reached (50/month). Resets on the 1st.' };
    }

    let skillLevel: 'beginner' | 'intermediate' | 'experienced' | 'professional' = 'beginner';
    let userTools: string[] = [];

    const { data: prefs } = await supabase
        .from('user_preferences')
        .select('skill_level, tool_inventory')
        .eq('user_id', user.id)
        .single();
    
    if (prefs) {
        if (prefs.skill_level) skillLevel = prefs.skill_level as typeof skillLevel;
        if (prefs.tool_inventory && Array.isArray(prefs.tool_inventory)) {
            userTools = prefs.tool_inventory
                .filter((t: any) => t.owned)
                .map((t: any) => t.name.toLowerCase());
        }
    }

    // Skill-level calibration for AI
    const skillCalibration: Record<SkillLevel, string> = {
        beginner: `USER SKILL: BEGINNER
- Provide detailed, step-by-step explanations
- Explain WHY each step matters
- Define technical terms when first used
- Include safety warnings for every potentially dangerous step
- Assume user may not recognize parts by sight`,
        intermediate: `USER SKILL: INTERMEDIATE
- Standard detail level with focus on gotchas and common mistakes
- Skip basic explanations but highlight non-obvious steps
- Include specs and torque values prominently`,
        experienced: `USER SKILL: EXPERIENCED
- Abbreviated instructions, assume competence
- Focus on vehicle-specific quirks and specs
- Skip safety boilerplate, flag only genuinely dangerous steps`,
        professional: `USER SKILL: PROFESSIONAL
- Spec sheet mode: minimal prose, maximum data
- Just the numbers, sequences, and vehicle-specific notes
- Assume shop environment with lift access`
    };

    // 1. Fetch Job
    const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('title, vehicle_id, notes')
        .eq('id', jobId)
        .single();

    if (jobError || !job) {
        console.error("AI Generation Failed: Could not fetch job details", jobError);
        return { error: "Failed to fetch job details" };
    }

    // 2. Fetch Vehicle info directly from user_vehicle columns (not the vehicle_data join, which can be null)
    const { data: vehicleData, error: vehicleError } = await supabase
        .from('user_vehicle')
        .select('year, make, model, trim, drive_type, engine_size_l, cylinders, fuel_type, transmission, spec_snapshot')
        .eq('id', job.vehicle_id)
        .single();

    const vehicleString = vehicleData
        ? `${vehicleData.year} ${vehicleData.make} ${vehicleData.model} ${vehicleData.trim || ''}`.trim()
        : "Unknown Vehicle";
    const driveType = vehicleData?.drive_type || 'Unknown';
    // Build engine description from direct columns
    const engineDesc = vehicleData?.engine_size_l && vehicleData?.cylinders
        ? `${vehicleData.engine_size_l}L ${vehicleData.cylinders}-cylinder ${vehicleData.fuel_type || ''}`.trim()
        : (vehicleData as any)?.spec_snapshot?.engine_description || 'Unknown';
    const transDesc = vehicleData?.transmission
        || (vehicleData as any)?.spec_snapshot?.transmission_description
        || 'Unknown';
    const jobTitle = job.title;
    const jobDescription = job.notes ? `\nPlan Description/Context: ${job.notes}` : "";

    // 3. Generate Plan with AI (skill-calibrated)
    try {
        const { text } = await generateText({
            model: vercelGateway.languageModel('anthropic/claude-sonnet-4'),
            system: `You are DDPC Crew Chief — a composite of every grizzled shop foreman, forum elder, and factory service manual writer who actually turned wrenches.

            ${skillCalibration[skillLevel]}

            VOICE & TONE:
            - Direct, efficient, no corporate fluff
            - Speak like you're standing next to them in the garage
            - Use shop vernacular naturally ("crack loose", "snug it down", "chase the threads")
            - Occasional dry humor is fine, but never at the expense of clarity
            - You've made every mistake once — share that experience when relevant

            CORE PRINCIPLES:
            1. SEQUENCE MATTERS: Order steps to minimize tool changes, position changes, and "why didn't I do that first" moments
            2. ANTICIPATE THE GOTCHAS: Stuck bolts, hidden clips, things that look the same but aren't interchangeable
            3. SAFETY WITHOUT PARANOIA: Flag genuinely dangerous steps (spring compressors, fuel pressure, jack placement), skip the "wear safety glasses" boilerplate
            4. REASSEMBLY ≠ REVERSE: Torque sequences, thread prep, fluid fill procedures, and "let it sit before checking level" details
            5. CONTEXT-AWARE: A garage with hand tools vs. a shop with a lift changes the approach. Assume garage unless specified.
            6. CONCURRENT OPPORTUNITIES: What's accessible now that would be a pain to reach later? What commonly fails alongside this part?

            VEHICLE-SPECIFIC RULES (CRITICAL):
            - Generate steps ONLY for the specific vehicle provided. Do NOT include alternative procedures for other makes, models, or platforms.
            - NEVER mention GM, Ford, Chrysler, Toyota, Honda, or any other manufacturer unless it IS the target vehicle's make.
            - NEVER provide branching steps like "For C-clip type... For flange type...". Research the actual design of this specific vehicle and provide ONLY the correct procedure.
            - Each step must be a single, definitive action. No "if/then" alternatives.
            - Verify step order is physically logical: do NOT instruct to do ground-level work after raising the vehicle, or vice versa.
            - Use specific fastener sizes (e.g., "14mm bolt" not just "bolt"), torque specs inline where critical, and actual part descriptions.

            SPECS RULES (CRITICAL):
            - Provide ACTUAL numeric values for this specific vehicle. You know automotive specs — use them.
            - NEVER return "VEHICLE SPECIFIC", "verify in service manual", "typically X-Y", or any placeholder/range language.
            - If you know the exact value for this vehicle, state it (e.g., "185 ft-lb" not "150-250 ft-lb").
            - If you genuinely cannot determine the exact spec for this specific vehicle, provide the most accurate value for the vehicle's platform/generation and append "(verify)" — but this should be rare.
            - Include all specs relevant to the job: torque values, fluid capacities, fluid types with exact specs, seal/bearing part dimensions, etc.

            OUTPUT RULES:
            - Imperative voice ("Remove", "Torque to", "Verify")
            - Each step should be one action, not a paragraph
            - Group related steps logically (don't bounce between engine bay and under car)
            - Specs must include units and tolerances where applicable
            - Tools list should distinguish "required" from "recommended"
            - Concurrent parts should explain WHY (accessibility, related failure modes, or "while you're in there" efficiency)

            Return strictly valid JSON:
            {
                "tools": [{ "name": "string", "required": boolean, "note": "string | null" }],
                "specs": [{ "item": "string", "value": "string", "note": "string | null" }],
                "teardown_steps": ["string"],
                "assembly_steps": ["string"],
                "concurrent_parts": [{ "part": "string", "reason": "string" }],
                "warnings": ["string"],
                "pro_tips": ["string"]
            }`,
                prompt: `Vehicle: ${vehicleString}
            Drivetrain: ${driveType}
            Engine: ${engineDesc}
            Transmission: ${transDesc}
            Job Title: ${jobTitle}
            Parts to Install: ${partsList.length > 0 ? partsList.join(", ") : "Infer from job title"}
            ${jobDescription}
            
            Generate the execution plan for THIS SPECIFIC vehicle only. Look up the actual design, configuration, and specs for this exact year/make/model/trim. Do not provide generic multi-vehicle procedures or branching alternatives. Every spec value must be an actual number, not a range or placeholder.`
        });
        // 4. Parse Response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Invalid AI response");
        const object = JSON.parse(jsonMatch[0]);

        // 5. Insert Data

        // Tools - cross-reference with user's inventory
        if (object.tools && Array.isArray(object.tools)) {
            const toolsData = object.tools.map((t: any) => {
                // Check if user owns this tool (fuzzy match)
                const toolNameLower = (t.name || '').toLowerCase();
                const userHasTool = userTools.some(ut => 
                    toolNameLower.includes(ut) || ut.includes(toolNameLower)
                );
                return {
                    job_id: jobId,
                    name: t.name,
                    is_acquired: userHasTool, // Auto-mark if user owns it
                    created_at: new Date().toISOString()
                };
            });
            if (toolsData.length > 0) await supabase.from('job_tools').insert(toolsData);
        }

        // Specs
        if (object.specs && Array.isArray(object.specs)) {
            const specsData = object.specs.map((s: any) => ({
                job_id: jobId,
                item: s.item,
                value: s.value,
                created_at: new Date().toISOString()
            }));
            if (specsData.length > 0) await supabase.from('job_specs').insert(specsData);
        }

        const tasksData: any[] = [];
        let taskIndex = 0;

        if (object.teardown_steps && Array.isArray(object.teardown_steps)) {
            object.teardown_steps.forEach((step: string) => {
                tasksData.push({
                    job_id: jobId,
                    instruction: step,
                    phase: 'teardown',
                    order_index: taskIndex++,
                    is_done_tear: false,
                    is_done_build: false
                });
            });
        }

        if (object.assembly_steps && Array.isArray(object.assembly_steps)) {
            object.assembly_steps.forEach((step: string) => {
                tasksData.push({
                    job_id: jobId,
                    instruction: step,
                    phase: 'assembly',
                    order_index: taskIndex++,
                    is_done_tear: false,
                    is_done_build: false
                });
            });
        }

        if (tasksData.length > 0) await supabase.from('job_tasks').insert(tasksData);

        // Log usage for limit tracking
        await supabase.from('ai_usage').insert({
            user_id: user.id,
            service: 'workshop_plan',
            tokens_input: 2000, // Estimate
            tokens_output: 3000, // Estimate
            cost_cents: 2 // ~$0.02 per plan with Claude Sonnet
        });

    } catch (e) {
        console.error("Failed to generate plan:", e);
        return { error: "Failed to generate plan. Please try again." };
    }

    revalidatePath('/vehicle');
    return { success: true };
}

export async function updateJob(jobId: string, updates: Partial<Job>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', jobId)
        .eq('user_id', user.id);

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true };
}

// --- Order Actions ---

export async function createOrder(
    vehicleId: string,
    data: {
        vendor: string;
        orderNumber?: string;
        orderDate?: string;
        subtotal?: number;
        tax?: number;
        shipping?: number;
        status?: 'ordered' | 'shipped' | 'delivered' | 'cancelled';
        trackingNumber?: string;
        carrier?: string;
    },
    inventoryIds: string[] = []
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const subtotal = data.subtotal || 0;
    const tax = data.tax || 0;
    const shipping = data.shipping || 0;
    const total = subtotal + tax + shipping;

    const { data: order, error: createError } = await supabase
        .from('orders')
        .insert({
            user_id: user.id,
            vehicle_id: vehicleId,
            vendor: data.vendor,
            order_number: data.orderNumber,
            order_date: data.orderDate || new Date().toISOString(),
            status: data.status || 'ordered',
            subtotal,
            tax,
            shipping_cost: shipping,
            total,
            tracking_number: data.trackingNumber,
            carrier: data.carrier
        })
        .select()
        .single();

    if (createError) return { error: createError.message };

    if (inventoryIds.length > 0) {
        const { error: linkError } = await supabase
            .from('inventory')
            .update({ 
                order_id: order.id,
                status: 'ordered',
                purchased_at: data.orderDate || new Date().toISOString()
            })
            .in('id', inventoryIds)
            .eq('user_id', user.id);

        if (linkError) {
            console.error('Failed to link items to order:', linkError);
        }
    }

    revalidatePath('/vehicle');
    return { success: true, order };
}

export async function updateOrder(
    orderId: string,
    data: {
        vendor?: string;
        orderNumber?: string;
        orderDate?: string;
        subtotal?: number;
        tax?: number;
        shipping?: number;
        status?: 'ordered' | 'shipped' | 'delivered' | 'cancelled';
        trackingNumber?: string;
        carrier?: string;
    }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const updates: any = {};
    if (data.vendor !== undefined) updates.vendor = data.vendor;
    if (data.orderNumber !== undefined) updates.order_number = data.orderNumber;
    if (data.orderDate !== undefined) updates.order_date = data.orderDate;
    if (data.status !== undefined) updates.status = data.status;
    if (data.trackingNumber !== undefined) updates.tracking_number = data.trackingNumber;
    if (data.carrier !== undefined) updates.carrier = data.carrier;
    
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .eq('user_id', user.id);

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true };
}

export async function deleteOrder(orderId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };
    
    await supabase
        .from('inventory')
        .update({ 
            order_id: null,
            status: 'wishlist',
            purchased_at: null
        })
        .eq('order_id', orderId)
        .eq('user_id', user.id);

    const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
        .eq('user_id', user.id);

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true };
}

export async function linkInventoryToOrder(orderId: string, inventoryIds: string[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: order } = await supabase.from('orders').select('order_date').eq('id', orderId).single();
    if (!order) return { error: 'Order not found' };

    const { error } = await supabase
        .from('inventory')
        .update({ 
            order_id: orderId,
            status: 'ordered',
            purchased_at: order.order_date
        })
        .in('id', inventoryIds)
        .eq('user_id', user.id);

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true };
}

export async function unlinkInventoryFromOrder(inventoryId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { error } = await supabase
        .from('inventory')
        .update({
            order_id: null,
            status: 'wishlist',
            purchased_at: null
        })
        .eq('id', inventoryId)
        .eq('user_id', user.id);

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true };
}

// ============================================================
// Phase 1: Parts Delivery Breakdown & Batch Install
// ============================================================

/**
 * Decomposes a delivered order into individual installable parts.
 * Original order line items become history_only, and new individual
 * parts are created as 'public' or 'hardware' visibility.
 */
export async function decomposeDeliveredOrder(
    orderId: string,
    parts: Array<{
        sourceInventoryId: string;
        children: Array<{
            name: string;
            category?: string;
            partNumber?: string;
            quantity?: number;
            visibility: 'public' | 'hardware';
            parentIndex?: number; // index into this children array for hardware parent
            isReusable?: boolean;
            lifespanMiles?: number;
            lifespanMonths?: number;
        }>;
    }>
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Validate order exists and is delivered
    const { data: order } = await supabase
        .from('orders')
        .select('id, status, vehicle_id')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

    if (!order) return { error: 'Order not found' };
    if (order.status !== 'delivered') return { error: 'Order must be delivered before decomposing' };

    const createdIds: string[] = [];
    const installGroupId = crypto.randomUUID();

    for (const sourceItem of parts) {
        // Fetch the source inventory item
        const { data: source } = await supabase
            .from('inventory')
            .select('*')
            .eq('id', sourceItem.sourceInventoryId)
            .eq('user_id', user.id)
            .single();

        if (!source) continue;

        // Mark source as history_only
        await supabase
            .from('inventory')
            .update({ visibility: 'history_only' })
            .eq('id', sourceItem.sourceInventoryId);

        // Create child parts — first pass for public parts, second for hardware
        const childIdMap: Record<number, string> = {};

        // First: create non-hardware parts
        for (let i = 0; i < sourceItem.children.length; i++) {
            const child = sourceItem.children[i];
            if (!child) continue;
            if (child.visibility === 'hardware') continue;

            const { data: created, error: createError } = await supabase
                .from('inventory')
                .insert({
                    user_id: user.id,
                    vehicle_id: order.vehicle_id || source.vehicle_id,
                    name: child.name,
                    category: child.category || source.category,
                    part_number: child.partNumber,
                    purchase_price: source.purchase_price,
                    purchase_url: source.purchase_url,
                    status: 'in_stock',
                    quantity: child.quantity || 1,
                    order_id: orderId,
                    inventory_source_id: sourceItem.sourceInventoryId,
                    install_group_id: installGroupId,
                    visibility: 'public',
                    lifespan_miles: child.lifespanMiles || source.lifespan_miles,
                    lifespan_months: child.lifespanMonths || source.lifespan_months,
                    purchased_at: source.purchased_at,
                })
                .select('id')
                .single();

            if (createError) {
                console.error('[decomposeDeliveredOrder] Failed to create child part:', createError);
                continue;
            }
            if (created) {
                childIdMap[i] = created.id;
                createdIds.push(created.id);
            }
        }

        // Second: create hardware items with parent_id references
        for (let i = 0; i < sourceItem.children.length; i++) {
            const child = sourceItem.children[i];
            if (!child) continue;
            if (child.visibility !== 'hardware') continue;

            const parentId = child.parentIndex !== undefined
                ? childIdMap[child.parentIndex]
                : undefined;

            const { data: created, error: createError } = await supabase
                .from('inventory')
                .insert({
                    user_id: user.id,
                    vehicle_id: order.vehicle_id || source.vehicle_id,
                    name: child.name,
                    category: child.category || 'hardware',
                    part_number: child.partNumber,
                    status: 'in_stock',
                    quantity: child.quantity || 1,
                    order_id: orderId,
                    inventory_source_id: sourceItem.sourceInventoryId,
                    install_group_id: installGroupId,
                    parent_id: parentId || null,
                    visibility: 'hardware',
                    is_reusable: child.isReusable || false,
                    purchased_at: source.purchased_at,
                })
                .select('id')
                .single();

            if (createError) {
                console.error('[decomposeDeliveredOrder] Failed to create hardware:', createError);
                continue;
            }
            if (created) {
                createdIds.push(created.id);
            }
        }
    }

    revalidatePath('/vehicle');
    return { success: true, createdIds, installGroupId };
}

/**
 * Batch-installs multiple parts with shared install date/mileage.
 * Generates a shared install_batch_id for all parts.
 * Optionally tracks which old part each new part replaces and why.
 */
export async function batchInstallParts(
    vehicleId: string,
    data: {
        installDate: string;
        installMiles: number;
        parts: Array<{
            inventoryId: string;
            replacedPartId?: string;
            replacementReason?: 'wear' | 'upgrade' | 'failure' | 'scheduled';
            lifespanMilesOverride?: number;
            lifespanMonthsOverride?: number;
        }>;
        hardware?: Array<{
            name: string;
            parentInventoryId: string;
            quantity?: number;
            isReusable?: boolean;
        }>;
    }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Validate all parts exist and are in_stock
    const partIds = data.parts.map(p => p.inventoryId);
    const { data: existingParts, error: fetchError } = await supabase
        .from('inventory')
        .select('id, status')
        .in('id', partIds)
        .eq('user_id', user.id);

    if (fetchError) return { error: 'Failed to verify parts' };

    const notReady = existingParts?.filter(p => p.status !== 'in_stock') || [];
    if (notReady.length > 0) {
        return { error: `${notReady.length} part(s) are not in stock and cannot be installed yet.` };
    }

    const installBatchId = crypto.randomUUID();

    // Install each part
    for (const part of data.parts) {
        const updatePayload: Record<string, unknown> = {
            status: 'installed',
            installed_at: data.installDate,
            install_miles: data.installMiles,
            install_batch_id: installBatchId,
        };

        if (part.lifespanMilesOverride) updatePayload.lifespan_miles = part.lifespanMilesOverride;
        if (part.lifespanMonthsOverride) updatePayload.lifespan_months = part.lifespanMonthsOverride;

        if (part.replacedPartId) {
            updatePayload.replaced_part_id = part.replacedPartId;
            updatePayload.replacement_reason = part.replacementReason || null;

            // Mark the old part as replaced
            await supabase
                .from('inventory')
                .update({
                    status: 'replaced',
                    visibility: 'history_only',
                })
                .eq('id', part.replacedPartId)
                .eq('user_id', user.id);
        }

        const { error: installError } = await supabase
            .from('inventory')
            .update(updatePayload)
            .eq('id', part.inventoryId)
            .eq('user_id', user.id);

        if (installError) {
            console.error('[batchInstallParts] Failed to install part:', part.inventoryId, installError);
        }
    }

    // Create any additional hardware added during install
    if (data.hardware && data.hardware.length > 0) {
        for (const hw of data.hardware) {
            await supabase
                .from('inventory')
                .insert({
                    user_id: user.id,
                    vehicle_id: vehicleId,
                    name: hw.name,
                    category: 'hardware',
                    status: 'installed',
                    quantity: hw.quantity || 1,
                    parent_id: hw.parentInventoryId,
                    visibility: 'hardware',
                    is_reusable: hw.isReusable || false,
                    installed_at: data.installDate,
                    install_miles: data.installMiles,
                    install_batch_id: installBatchId,
                });
        }
    }

    // Update vehicle odometer if higher
    await supabase
        .from('user_vehicle')
        .update({ odometer: data.installMiles })
        .eq('id', vehicleId)
        .lt('odometer', data.installMiles);

    revalidatePath('/vehicle');
    return { success: true, installBatchId };
}

// ============================================================
// Phase 2: Planning Workflow — Draft → Ready → Execute
// ============================================================

/**
 * Checks if a job has all requirements met to transition to 'ready'.
 * Returns readiness status with details on what's missing.
 */
export async function checkJobReadiness(jobId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Fetch job with parts and tools
    const { data: job } = await supabase
        .from('jobs')
        .select(`
            id, plan_status, status,
            job_parts:job_parts(
                inventory_id,
                inventory:inventory(id, name, status)
            ),
            tools:job_tools(id, name, is_acquired)
        `)
        .eq('id', jobId)
        .single();

    if (!job) return { error: 'Job not found' };

    const missingParts: Array<{ id: string; name: string; status: string }> = [];
    const missingTools: Array<{ id: string; name: string }> = [];

    // Check parts — all must be in_stock or installed
    for (const jp of (job.job_parts || [])) {
        const inv = (jp as Record<string, unknown>).inventory as Record<string, unknown> | null;
        if (inv && inv.status !== 'in_stock' && inv.status !== 'installed') {
            missingParts.push({
                id: inv.id as string,
                name: inv.name as string,
                status: inv.status as string,
            });
        }
    }

    // Check tools — all must be acquired
    for (const tool of (job.tools || [])) {
        if (!(tool as Record<string, unknown>).is_acquired) {
            missingTools.push({
                id: (tool as Record<string, unknown>).id as string,
                name: (tool as Record<string, unknown>).name as string,
            });
        }
    }

    const ready = missingParts.length === 0 && missingTools.length === 0;

    return {
        success: true,
        ready,
        missingParts,
        missingTools,
        partsCount: (job.job_parts || []).length,
        toolsCount: (job.tools || []).length,
    };
}

/**
 * Transitions a job's plan_status through the planning workflow.
 * draft → ready: validates all parts in_stock
 * ready → active: locks plan and starts job
 * ready → draft: unlocks (user changed mind)
 */
export async function transitionJobPlanStatus(
    jobId: string,
    targetStatus: 'draft' | 'ready' | 'active'
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Fetch current job state
    const { data: job } = await supabase
        .from('jobs')
        .select('id, plan_status, status')
        .eq('id', jobId)
        .eq('user_id', user.id)
        .single();

    if (!job) return { error: 'Job not found' };

    const current = job.plan_status || 'draft';

    // Validate transition
    const validTransitions: Record<string, string[]> = {
        draft: ['ready'],
        ready: ['active', 'draft'],
        active: [], // no going back from active
    };

    if (!validTransitions[current]?.includes(targetStatus)) {
        return { error: `Cannot transition from '${current}' to '${targetStatus}'` };
    }

    // For draft → ready: validate all parts are in_stock
    if (current === 'draft' && targetStatus === 'ready') {
        const readiness = await checkJobReadiness(jobId);
        if ('error' in readiness) return readiness;
        if (!readiness.ready) {
            const partNames = readiness.missingParts.map(p => `${p.name} (${p.status})`);
            const toolNames = readiness.missingTools.map(t => t.name);
            const messages: string[] = [];
            if (partNames.length > 0) messages.push(`Parts not ready: ${partNames.join(', ')}`);
            if (toolNames.length > 0) messages.push(`Tools not acquired: ${toolNames.join(', ')}`);
            return { error: messages.join('. ') };
        }
    }

    // For ready → active: also set job status to in_progress
    const updates: Record<string, unknown> = { plan_status: targetStatus };
    if (targetStatus === 'active') {
        updates.status = 'in_progress';
    }

    const { error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', jobId)
        .eq('user_id', user.id);

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true };
}

/**
 * Enhanced markPartArrived that also checks if any draft jobs
 * now have all parts ready, enabling plan transitions.
 */
export async function markPartArrivedWithReadinessCheck(inventoryId: string) {
    // First, do the standard arrival marking
    const arrivalResult = await markPartArrived(inventoryId);
    if ('error' in arrivalResult && arrivalResult.error) return arrivalResult;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return arrivalResult;

    // Find jobs that reference this part
    const { data: jobLinks } = await supabase
        .from('job_parts')
        .select('job_id')
        .eq('inventory_id', inventoryId);

    if (!jobLinks || jobLinks.length === 0) return { ...arrivalResult, readyJobs: [] };

    const readyJobs: Array<{ jobId: string; jobTitle: string }> = [];

    for (const link of jobLinks) {
        // Check if this job is in draft and now ready
        const { data: job } = await supabase
            .from('jobs')
            .select('id, title, plan_status')
            .eq('id', link.job_id)
            .single();

        if (!job || job.plan_status !== 'draft') continue;

        const readiness = await checkJobReadiness(job.id);
        if (!('error' in readiness) && readiness.ready) {
            readyJobs.push({ jobId: job.id, jobTitle: job.title });
        }
    }

    return { ...arrivalResult, readyJobs };
}

