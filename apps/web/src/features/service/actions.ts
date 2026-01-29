'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { JobStepData } from './components/JobStep'
import { ServiceLogInputs } from './schema'

export type ServiceActionResponse = {
  success: boolean
  error?: string
  data?: any
  details?: { message?: string; path?: (string | number)[] }[]
}

export async function addJobStep(jobPlanId: string, description: string, stepOrder: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('job_steps')
    .insert({
      job_plan_id: jobPlanId,
      step_order: stepOrder,
      description: description,
      is_completed: false,
      is_completed_reassembly: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding step:', error)
    throw new Error('Failed to add step')
  }

  revalidatePath('/vehicle/[id]/service/[jobTitle]', 'page')
  return data
}

export async function updateJobStep(stepId: string, updates: Partial<JobStepData> & { is_completed_reassembly?: boolean }) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('job_steps')
    .update(updates)
    .eq('id', stepId)

  if (error) {
    console.error('Error updating step:', error)
    throw new Error('Failed to update step')
  }

  revalidatePath('/vehicle/[id]/service/[jobTitle]', 'page')
}

export async function duplicateJobStep(stepId: string): Promise<ServiceActionResponse> {
  const supabase = await createClient()

  // 1. Fetch the step to duplicate
  const { data: step, error: stepError } = await supabase
    .from('job_steps')
    .select('*')
    .eq('id', stepId)
    .single()

  if (stepError || !step) {
    return { success: false, error: 'Step not found' }
  }

  // 2. Fetch all steps in the plan to shift order
  const { data: allSteps, error: listError } = await supabase
    .from('job_steps')
    .select('id, step_order')
    .eq('job_plan_id', step.job_plan_id)
    .gte('step_order', step.step_order + 1)
    .order('step_order', { ascending: true })

  if (listError) {
    return { success: false, error: 'Failed to fetch steps list' }
  }

  // 3. Shift steps down
  if (allSteps && allSteps.length > 0) {
    const promises = allSteps.map(s =>
      supabase
        .from('job_steps')
        .update({ step_order: s.step_order + 1 })
        .eq('id', s.id)
    )
    await Promise.all(promises)
  }

  // 4. Insert duplicate step
  const { data: newStep, error: insertError } = await supabase
    .from('job_steps')
    .insert({
      job_plan_id: step.job_plan_id,
      step_order: step.step_order + 1,
      description: step.description + ' (Copy)',
      notes: step.notes,
      is_completed: false,
      is_completed_reassembly: false,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error duplicating step:', insertError)
    return { success: false, error: 'Failed to create duplicate step' }
  }

  revalidatePath('/vehicle/[id]/service/[jobTitle]', 'page')
  return { success: true, data: newStep }
}

export async function deleteJobStep(stepId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('job_steps')
    .delete()
    .eq('id', stepId)

  if (error) {
    console.error('Error deleting step:', error)
    throw new Error('Failed to delete step')
  }

  revalidatePath('/vehicle/[id]/service/[jobTitle]', 'page')
}

export async function reorderJobSteps(updates: { id: string; step_order: number }[]) {
  const supabase = await createClient()

  // Perform updates in parallel
  const promises = updates.map(update =>
    supabase
      .from('job_steps')
      .update({ step_order: update.step_order })
      .eq('id', update.id)
  )

  const results = await Promise.all(promises)
  const errors = results.filter(r => r.error)

  if (errors.length > 0) {
    console.error('Error reordering steps:', errors)
    throw new Error('Failed to reorder steps')
  }

  revalidatePath('/vehicle/[id]/service/[jobTitle]', 'page')
}

export async function duplicateJobPlan(originalJobPlanId: string, newName: string, userId: string): Promise<ServiceActionResponse> {
  const supabase = await createClient()

  // 1. Fetch original job plan details
  const { data: originalPlan, error: planError } = await supabase
    .from('job_plans')
    .select(`
      maintenance_log_id,
      maintenance_log:maintenance_log_id (
        user_vehicle_id,
        service_item_id,
        event_date,
        odometer,
        cost,
        service_provider,
        notes,
        status
      )
    `)
    .eq('id', originalJobPlanId)
    .single()

  if (planError || !originalPlan) {
    return { success: false, error: 'Original job plan not found.' }
  }

  const originalLog = originalPlan.maintenance_log as any

  // 2. Create new maintenance log
  const { data: newLog, error: logError } = await supabase
    .from('maintenance_log')
    .insert({
      user_vehicle_id: originalLog.user_vehicle_id,
      service_item_id: originalLog.service_item_id,
      event_date: originalLog.event_date,
      odometer: originalLog.odometer,
      cost: originalLog.cost,
      service_provider: originalLog.service_provider,
      notes: originalLog.notes,
      status: 'Plan', // Always start as Plan
    })
    .select()
    .single()

  if (logError) {
    return { success: false, error: 'Failed to create new maintenance log.' }
  }

  // 3. Create new job plan
  const { data: newJobPlan, error: jobError } = await supabase
    .from('job_plans')
    .insert({
      user_id: userId,
      maintenance_log_id: newLog.id,
      name: newName,
    })
    .select()
    .single()

  if (jobError) {
    return { success: false, error: 'Failed to create new job plan.' }
  }

  // 4. Fetch original steps
  const { data: steps, error: stepsError } = await supabase
    .from('job_steps')
    .select('*')
    .eq('job_plan_id', originalJobPlanId)
    .order('step_order', { ascending: true })

  if (stepsError) {
    return { success: false, error: 'Failed to fetch original steps.' }
  }

  // 5. Copy steps to new plan
  if (steps && steps.length > 0) {
    const newSteps = steps.map(step => ({
      job_plan_id: newJobPlan.id,
      step_order: step.step_order,
      description: step.description,
      notes: step.notes,
      is_completed: false, // Reset completion status
      is_completed_reassembly: false,
    }))

    const { error: copyError } = await supabase
      .from('job_steps')
      .insert(newSteps)

    if (copyError) {
      return { success: false, error: 'Failed to copy steps.' }
    }
  }

  revalidatePath('/vehicle/[id]/service', 'page')
  return { success: true, data: newJobPlan }
}

export async function archiveJobPlan(jobPlanId: string): Promise<ServiceActionResponse> {
  const supabase = await createClient()

  // Get maintenance log id
  const { data: plan } = await supabase.from('job_plans').select('maintenance_log_id').eq('id', jobPlanId).single()

  if (!plan) return { success: false, error: 'Plan not found' }

  const { error } = await supabase
    .from('maintenance_log')
    .update({ status: 'Archive' })
    .eq('id', plan.maintenance_log_id)

  if (error) {
    console.error('Error archiving plan:', error)
    return { success: false, error: 'Failed to archive plan' }
  }

  revalidatePath('/vehicle/[id]/service', 'page')
  return { success: true }
}

export async function restoreJobPlan(jobPlanId: string): Promise<ServiceActionResponse> {
  const supabase = await createClient()

  const { data: plan } = await supabase.from('job_plans').select('maintenance_log_id').eq('id', jobPlanId).single()

  if (!plan) return { success: false, error: 'Plan not found' }

  const { error } = await supabase
    .from('maintenance_log')
    .update({ status: 'Plan' })
    .eq('id', plan.maintenance_log_id)

  if (error) {
    console.error('Error restoring plan:', error)
    return { success: false, error: 'Failed to restore plan' }
  }

  revalidatePath('/vehicle/[id]/service', 'page')
  return { success: true }
}

export async function permanentDeleteJobPlan(jobPlanId: string, confirmedName: string): Promise<ServiceActionResponse> {
  const supabase = await createClient()

  const { data: plan } = await supabase
    .from('job_plans')
    .select('name, maintenance_log_id')
    .eq('id', jobPlanId)
    .single()

  if (!plan) return { success: false, error: 'Plan not found' }

  if (plan.name !== confirmedName) {
    return { success: false, error: 'Plan name does not match' }
  }

  // Delete maintenance log (cascade should handle job plan, but let's be safe)
  // Actually, job_plans references maintenance_log. So deleting maintenance_log should cascade if configured,
  // or we delete job_plan first.
  // Assuming cascade is set up on maintenance_log deletion or just delete explicitly.

  const { error } = await supabase
    .from('maintenance_log')
    .delete()
    .eq('id', plan.maintenance_log_id)

  if (error) {
    console.error('Error deleting plan:', error)
    return { success: false, error: 'Failed to delete plan' }
  }

  revalidatePath('/vehicle/[id]/service', 'page')
  return { success: true }
}

export async function logPlannedService(data: ServiceLogInputs): Promise<ServiceActionResponse> {
  const supabase = await createClient()

  // 1. Create the service log
  const { data: log, error: logError } = await supabase
    .from('maintenance_log')
    .insert({
      user_vehicle_id: data.user_vehicle_id,
      service_item_id: data.service_item_id,
      event_date: data.event_date,
      odometer: data.odometer,
      cost: data.cost,
      service_provider: data.service_provider,
      notes: data.notes,
      status: data.status,
    })
    .select()
    .single()

  if (logError) {
    return { success: false, error: logError.message }
  }

  // 2. If it was a planned item, we might need to update the plan item status
  if (data.plan_item_id) {
    const { error: deleteError } = await supabase
      .from('maintenance_log')
      .delete()
      .eq('id', data.plan_item_id)

    if (deleteError) {
      console.error('Error deleting planned item:', deleteError)
    }
  }

  revalidatePath('/vehicle/[id]/service', 'page')
  return { success: true, data: log }
}

export async function logFreeTextService(data: ServiceLogInputs): Promise<ServiceActionResponse> {
  const supabase = await createClient()

  const { data: log, error: logError } = await supabase
    .from('maintenance_log')
    .insert({
      user_vehicle_id: data.user_vehicle_id,
      service_item_id: data.service_item_id,
      event_date: data.event_date,
      odometer: data.odometer,
      cost: data.cost,
      service_provider: data.service_provider,
      notes: data.notes,
      status: data.status,
    })
    .select()
    .single()

  if (logError) {
    return { success: false, error: logError.message }
  }

  revalidatePath('/vehicle/[id]/service', 'page')
  return { success: true, data: log }
}

export async function deleteServiceLog(logId: string): Promise<ServiceActionResponse> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('maintenance_log')
    .delete()
    .eq('id', logId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/vehicle/[id]/service', 'page')
  return { success: true }
}

export async function updateJobTitle(jobPlanId: string, newTitle: string, userId: string): Promise<ServiceActionResponse> {
  const supabase = await createClient()

  // 1. Check for uniqueness
  const { data: existing } = await supabase
    .from('job_plans')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', newTitle)
    .neq('id', jobPlanId)
    .single()

  if (existing) {
    return { success: false, error: 'A job plan with this name already exists.' }
  }

  // 2. Update job plan name
  const { error: updateError } = await supabase
    .from('job_plans')
    .update({ name: newTitle })
    .eq('id', jobPlanId)

  if (updateError) {
    console.error('Error updating job plan:', updateError)
    return { success: false, error: 'Failed to update job plan name.' }
  }

  revalidatePath('/vehicle/[id]/service/[jobTitle]', 'page')
  revalidatePath('/vehicle/[id]/service', 'page')

  return { success: true }
}

export async function getServiceCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('service_categories')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }
  return data
}

export async function getServiceItems(categoryId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('service_items')
    .select('id, name, description, category_id')
    .eq('category_id', categoryId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching items:', error)
    return []
  }
  return data
}
