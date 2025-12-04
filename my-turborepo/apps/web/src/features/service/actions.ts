'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { JobStepData } from './components/JobStep'

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
