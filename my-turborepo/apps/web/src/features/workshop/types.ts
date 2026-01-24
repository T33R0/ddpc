import { VehicleInstalledComponent } from '@/features/parts/types';

export type JobStatus = 'planned' | 'in_progress' | 'completed' | 'paused';

export interface JobTask {
    id: string;
    job_id: string;
    order_index: number;
    instruction: string;
    notes?: string | null;
    is_done_tear: boolean;
    is_done_build: boolean;
}

export interface Job {
    id: string;
    vehicle_id: string;
    user_id: string;
    title: string;
    created_at: string;
    date_completed?: string | null;
    status: JobStatus;
    type?: string; // 'repair', 'mod', 'maintenance' etc.
    odometer?: number | null;
    cost_total?: number | null;
    vendor?: string | null;
    notes?: string | null;

    // Joins
    tasks?: JobTask[];
    // Parts linked to this job
    parts?: VehicleInstalledComponent[];
}

export interface WorkshopDataResponse {
    inventory: VehicleInstalledComponent[]; // Items in 'wishlist' or 'in_stock'
    jobs: Job[]; // Items in 'planned' or 'in_progress'
}
