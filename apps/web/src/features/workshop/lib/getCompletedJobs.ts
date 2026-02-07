'use server';

import { createClient } from '@/lib/supabase/server';
import { Job } from '../types';

export async function getCompletedJobs(vehicleId: string, searchQuery?: string): Promise<{ jobs: Job[] } | { error: string }> {
    const supabase = await createClient();

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return { error: 'Unauthorized' };

        // Base query
        let query = supabase
            .from('jobs')
            .select(`
                *,
                tasks:job_tasks(*),
                job_tasks(*),
                job_parts:job_parts(
                    inventory_id,
                    qty_used,
                    inventory:inventory(
                        *,
                        master_part:master_parts(*)
                    )
                ),
                tools:job_tools(*),
                specs:job_specs(*)
            `)
            .eq('vehicle_id', vehicleId)
            .eq('status', 'completed')
            .order('date_completed', { ascending: false });

        // Apply search filter if provided
        if (searchQuery && searchQuery.trim().length > 0) {
            query = query.ilike('title', `%${searchQuery.trim()}%`);
        }

        const { data: jobsData, error: jobsError } = await query;

        if (jobsError) {
            console.error('Error fetching completed jobs:', jobsError);
            return { error: 'Failed to fetch completed jobs' };
        }

        const formattedJobs: Job[] = jobsData.map((job: any) => {
            // Fallback to un-aliased job_tasks if alias is empty/missing (same logic as workshop actions)
            const rawTasks = (job.tasks && job.tasks.length > 0) ? job.tasks : (job.job_tasks || []);

            return {
                ...job,
                tasks: rawTasks.sort((a: any, b: any) => a.order_index - b.order_index),
                parts: job.job_parts?.map((jp: any) => ({
                    ...jp.inventory,
                    // Ensure we preserve the master_part join if it exists for display
                    master_part: jp.inventory?.master_part
                })) || []
            };
        });

        return { jobs: formattedJobs };

    } catch (err) {
        console.error('Unexpected error in getCompletedJobs:', err);
        return { error: 'Internal server error' };
    }
}
