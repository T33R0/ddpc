'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { WorkshopDataResponse, Job, JobTask } from './types';
import { VehicleInstalledComponent } from '@/features/parts/types';

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
        job_parts:job_parts(
            inventory_id,
            qty_used,
            inventory:inventory(*)
        )
      `)
            .eq('vehicle_id', vehicleId)
            .in('status', ['planned', 'in_progress'])
            .order('created_at', { ascending: false });

        if (jobsError) {
            console.error('Error fetching jobs:', jobsError);
            return { error: 'Failed to fetch jobs' };
        }

        const formattedJobs: Job[] = jobsData.map((job: any) => ({
            ...job,
            tasks: job.tasks?.sort((a: any, b: any) => a.order_index - b.order_index),
            parts: job.job_parts?.map((jp: any) => jp.inventory) || []
        }));

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

export async function createJob(vehicleId: string, title: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data, error } = await supabase
        .from('jobs')
        .insert({
            vehicle_id: vehicleId,
            user_id: user.id,
            title: title,
            status: 'planned',
            created_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true, job: data };
}

export async function addPartToJob(jobId: string, inventoryId: string) {
    const supabase = await createClient();

    // Link in job_parts table
    const { error } = await supabase
        .from('job_parts')
        .insert({
            job_id: jobId,
            inventory_id: inventoryId
        });

    if (error) return { error: error.message };

    // Also verify part is reserved? For now just link it.
    // Ideally we might want to flag the inventory item as "allocated" but schema provided only had specific statuses.
    // The prompt implies "Add to Job" links it.

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

export async function createJobTask(jobId: string, instruction: string) {
    const supabase = await createClient();

    // Get max order index
    const { data: maxOrder } = await supabase
        .from('job_tasks')
        .select('order_index')
        .eq('job_id', jobId)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

    const newIndex = (maxOrder?.order_index || 0) + 1;

    const { data, error } = await supabase
        .from('job_tasks')
        .insert({
            job_id: jobId,
            instruction,
            order_index: newIndex
        })
        .select()
        .single();

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true, task: data };
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
