import { VehicleInstalledComponent } from '@/features/parts/types';

export type JobStatus = 'planned' | 'in_progress' | 'completed' | 'paused';

export interface JobTool {
    id: string;
    job_id: string;
    name: string;
    is_acquired: boolean;
    note?: string;
    created_at: string;
}

export interface JobSpec {
    id: string;
    job_id: string;
    item: string;
    value: string;
    note?: string;
    created_at: string;
}

export interface JobTask {
    id: string;
    job_id: string;
    order_index: number;
    instruction: string;
    notes?: string | null;
    phase: 'teardown' | 'assembly';
    is_done_tear: boolean;
    is_done_build: boolean;
}

export type PlanStatus = 'draft' | 'ready' | 'active';

export interface Job {
    id: string;
    vehicle_id: string;
    user_id: string;
    title: string;
    created_at: string;
    date_completed?: string | null;
    status: JobStatus;
    plan_status: PlanStatus;
    type?: string; // 'repair', 'mod', 'maintenance' etc.
    odometer?: number | null;
    cost_total?: number | null;
    vendor?: string | null;
    notes?: string | null;
    order_index: number;

    // Joins
    tasks?: JobTask[];
    // Parts linked to this job
    parts?: VehicleInstalledComponent[];
    // Tools linked to this job
    tools?: JobTool[];
    // Specs linked to this job
    specs?: JobSpec[];
}

export interface WorkshopDataResponse {
    inventory: VehicleInstalledComponent[]; // Items in 'wishlist' or 'in_stock'
    jobs: Job[]; // Items in 'planned' or 'in_progress'
    orders: any[]; // Using any for now to avoid circular dependency if Order isn't exported, but better to import it
}
