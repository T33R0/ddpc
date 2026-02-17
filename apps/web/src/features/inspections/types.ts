export type InspectionType = 'routine' | 'pre_trip' | 'issue_investigation' | 'post_repair';

export type FindingSeverity = 'info' | 'monitor' | 'action_needed' | 'critical';

export type FindingStatus = 'open' | 'monitoring' | 'resolved';

export interface Inspection {
  id: string;
  vehicle_id: string;
  user_id: string;
  inspection_date: string;
  odometer: number | null;
  inspection_type: InspectionType;
  summary: string | null;
  notes: string | null;
  created_at: string;
  findings?: InspectionFinding[];
}

export interface InspectionFinding {
  id: string;
  inspection_id: string;
  inventory_id: string | null;
  fluid_id: string | null;
  finding: string;
  severity: FindingSeverity;
  action_taken: string | null;
  resolved_job_id: string | null;
  status: FindingStatus;
  created_at: string;
}
