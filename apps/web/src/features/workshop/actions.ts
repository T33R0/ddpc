'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { WorkshopDataResponse, Job, JobTask } from './types';
import { VehicleInstalledComponent } from '@/features/parts/types';
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

        // Debug logging
        if (formattedJobs.length > 0) {
            const jobWithTasks = formattedJobs.find((j: any) => j.tasks && j.tasks.length > 0);
            if (jobWithTasks) {
                console.log(`[getWorkshopData] Found job ${jobWithTasks.id} with ${jobWithTasks.tasks?.length} tasks.`);
            } else {
                console.log(`[getWorkshopData] Jobs found but NONE have tasks. Sample job raw tasks:`, jobsData[0]?.tasks, (jobsData[0] as any)?.job_tasks);
            }
        } else {
            console.log(`[getWorkshopData] No jobs found for vehicle ${vehicleId}`);
        }

        return {
            inventory: inventoryData as unknown as VehicleInstalledComponent[],
            jobs: formattedJobs
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

    const { error } = await supabase
        .from('inventory')
        .update({ 
            status: 'in_stock',
            tracking_number: null, // Clear tracking number as requested
            carrier: null // Clear carrier as well to keep it clean
        })
        .eq('id', inventoryId)
        .eq('user_id', user.id);

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true };
}

export async function createJob(vehicleId: string, title: string) {
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

    // 1. Fetch current item details
    const { data: item, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', inventoryId)
        .single();

    if (fetchError || !item) return { error: 'Part not found' };

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
    const { error } = await supabase
        .from('jobs')
        .update({ status: 'in_progress' })
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
        console.log(`[completeJob] Updating ${inventoryIds.length} parts to installed:`, inventoryIds);

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
        .select('title, vehicle_id')
        .eq('id', jobId)
        .single();

    if (jobError || !job) {
        console.error("AI Generation Failed: Could not fetch job details", jobError);
        return { error: "Failed to fetch job details" };
    }

    // 2. Fetch Vehicle with specs
    const { data: vehicleData, error: vehicleError } = await supabase
        .from('user_vehicle')
        .select('year, make, model, trim, vehicle_data(drive_type, engine_description, transmission_description)')
        .eq('id', job.vehicle_id)
        .single();

    const vd = (vehicleData as any)?.vehicle_data;
    const vehicleString = vehicleData
        ? `${vehicleData.year} ${vehicleData.make} ${vehicleData.model} ${vehicleData.trim || ''}`.trim()
        : "Unknown Vehicle";
    const driveType = vd?.drive_type || 'Unknown';
    const engineDesc = vd?.engine_description || 'Unknown';
    const transDesc = vd?.transmission_description || 'Unknown';
    const jobTitle = job.title;

    // 3. Generate Plan with AI (skill-calibrated)
    try {
        const { text } = await generateText({
            model: vercelGateway.languageModel('anthropic/claude-sonnet-4.5'),
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
            
            Generate the execution plan. IMPORTANT: For AWD/4WD vehicles, include steps for disconnecting/reconnecting axles and any drivetrain-specific procedures.`
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
        console.error("AI Generation Error:", e);
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
