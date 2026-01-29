export interface ModStepData {
  id: string
  mod_plan_id: string
  step_order: number
  description: string
  notes?: string | null
  is_completed: boolean
  is_completed_reassembly?: boolean
  created_at?: string
}

export interface ModPlanData {
  id: string
  user_id: string
  mod_log_id: string // FK to mods table
  name: string
  created_at?: string
}
