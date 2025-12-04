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

export async function updateJobStep(stepId: string, updates: Partial<JobStepData>) {
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

export async function saveJobTemplate(userId: string, name: string, steps: JobStepData[]) {
  const supabase = await createClient()

  // Create job template
  const { data: template, error: templateError } = await supabase
    .from('job_templates')
    .insert({
      user_id: userId,
      name: name,
    })
    .select('id')
    .single()

  if (templateError) {
    console.error('Error creating template:', templateError)
    throw new Error('Failed to create template')
  }

  if (!template) throw new Error('Failed to create template')

  // Create template steps
  const templateSteps = steps.map((step, index) => ({
    job_template_id: template.id,
    step_order: index + 1,
    description: step.description,
    notes: step.notes || null,
  }))

  const { error: stepsError } = await supabase
    .from('job_template_steps')
    .insert(templateSteps)

  if (stepsError) {
    console.error('Error creating template steps:', stepsError)
    throw new Error('Failed to create template steps')
  }
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

  // 2. Get the service_item_id from the job plan -> maintenance_log
  const { data: plan, error: planError } = await supabase
    .from('job_plans')
    .select(`
      maintenance_log_id,
      maintenance_log:maintenance_log_id (
        service_item_id
      )
    `)
    .eq('id', jobPlanId)
    .single()

  if (planError || !plan) {
    return { success: false, error: 'Job plan not found.' }
  }

  const serviceItemId = (plan.maintenance_log as any)?.service_item_id

  if (serviceItemId) {
    // 3. Update service item name
    const { error: itemError } = await supabase
      .from('service_items')
      .update({ name: newTitle })
      .eq('id', serviceItemId)

    if (itemError) {
      return { success: false, error: 'Failed to update service item name.' }
    }
  }

  // 4. Update job plan name
  const { error: updateError } = await supabase
    .from('job_plans')
    .update({ name: newTitle })
    .eq('id', jobPlanId)

  if (updateError) {
    return { success: false, error: 'Failed to update job plan name.' }
  }

  revalidatePath('/vehicle/[id]/service/[jobTitle]', 'page')
  revalidatePath('/vehicle/[id]/service', 'page')

  return { success: true }
}
