'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ModStepData } from './types'

export type ModActionResponse = {
  success: boolean
  error?: string
  data?: any
  details?: { message?: string; path?: (string | number)[] }[]
}

export async function addModStep(modPlanId: string, description: string, stepOrder: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mod_steps')
    .insert({
      mod_plan_id: modPlanId,
      step_order: stepOrder,
      description: description,
      is_completed: false,
      is_completed_reassembly: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding mod step:', error)
    throw new Error('Failed to add mod step')
  }

  revalidatePath('/vehicle/[id]/mods/[modId]', 'page')
  return data
}

export async function updateModStep(stepId: string, updates: Partial<ModStepData> & { is_completed_reassembly?: boolean }) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('mod_steps')
    .update(updates)
    .eq('id', stepId)

  if (error) {
    console.error('Error updating mod step:', error)
    throw new Error('Failed to update mod step')
  }

  revalidatePath('/vehicle/[id]/mods/[modId]', 'page')
}

export async function duplicateModStep(stepId: string): Promise<ModActionResponse> {
  const supabase = await createClient()

  // 1. Fetch the step to duplicate
  const { data: step, error: stepError } = await supabase
    .from('mod_steps')
    .select('*')
    .eq('id', stepId)
    .single()

  if (stepError || !step) {
    return { success: false, error: 'Step not found' }
  }

  // 2. Fetch all steps in the plan to shift order
  const { data: allSteps, error: listError } = await supabase
    .from('mod_steps')
    .select('id, step_order')
    .eq('mod_plan_id', step.mod_plan_id)
    .gte('step_order', step.step_order + 1)
    .order('step_order', { ascending: true })

  if (listError) {
    return { success: false, error: 'Failed to fetch steps list' }
  }

  // 3. Shift steps down
  if (allSteps && allSteps.length > 0) {
    const promises = allSteps.map(s =>
      supabase
        .from('mod_steps')
        .update({ step_order: s.step_order + 1 })
        .eq('id', s.id)
    )
    await Promise.all(promises)
  }

  // 4. Insert duplicate step
  const { data: newStep, error: insertError } = await supabase
    .from('mod_steps')
    .insert({
      mod_plan_id: step.mod_plan_id,
      step_order: step.step_order + 1,
      description: step.description + ' (Copy)',
      notes: step.notes,
      is_completed: false,
      is_completed_reassembly: false,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error duplicating mod step:', insertError)
    return { success: false, error: 'Failed to create duplicate mod step' }
  }

  revalidatePath('/vehicle/[id]/mods/[modId]', 'page')
  return { success: true, data: newStep }
}

export async function deleteModStep(stepId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('mod_steps')
    .delete()
    .eq('id', stepId)

  if (error) {
    console.error('Error deleting mod step:', error)
    throw new Error('Failed to delete mod step')
  }

  revalidatePath('/vehicle/[id]/mods/[modId]', 'page')
}

export async function reorderModSteps(updates: { id: string; step_order: number }[]) {
  const supabase = await createClient()

  // Perform updates in parallel
  const promises = updates.map(update =>
    supabase
      .from('mod_steps')
      .update({ step_order: update.step_order })
      .eq('id', update.id)
  )

  const results = await Promise.all(promises)
  const errors = results.filter(r => r.error)

  if (errors.length > 0) {
    console.error('Error reordering mod steps:', errors)
    throw new Error('Failed to reorder mod steps')
  }

  revalidatePath('/vehicle/[id]/mods/[modId]', 'page')
}

export async function duplicateModPlan(originalModPlanId: string, newName: string, userId: string, targetModId: string): Promise<ModActionResponse> {
  const supabase = await createClient()

  // 1. Fetch original mod plan details
  const { data: originalPlan, error: planError } = await supabase
    .from('mod_plans')
    .select('*')
    .eq('id', originalModPlanId)
    .single()

  if (planError || !originalPlan) {
    return { success: false, error: 'Original mod plan not found.' }
  }

  // 2. Create new mod plan associated with the SAME or DIFFERENT mod?
  // Usually, a plan is 1:1 with a Mod.
  // If we duplicate, we likely want to duplicate it for *another* Mod or replace the current one?
  // Or maybe "Duplicate Job" in service creates a NEW Service Log (maintenance_log).
  // Here, we are already inside a specific Mod page.
  // If the user wants to duplicate this plan, where does it go?
  // "Duplicate Job" in Service creates a NEW Job (new maintenance_log).
  // A Mod is a persistent entity.
  // If I duplicate a Mod Plan, do I create a new Mod? Or just a plan variant?
  // The prompt says: "make it so that each mod has the ability to have a plan".
  // This suggests 1 plan per mod.
  // If I duplicate, I probably need to create a NEW MOD as well?
  // Service: `duplicateJobPlan` creates a NEW `maintenance_log` and `job_plan`.
  // Here, I should probably create a NEW `mods` entry + `mod_plan`.

  // Fetch original mod to duplicate it first
  const { data: originalMod } = await supabase
    .from('mods')
    .select('*')
    .eq('id', originalPlan.mod_log_id) // using mod_log_id as decided
    .single()

  if (!originalMod) {
    return { success: false, error: 'Original mod not found.' }
  }

  // Create new Mod (copy)
  const { data: newMod, error: modError } = await supabase
    .from('mods')
    .insert({
      user_vehicle_id: originalMod.user_vehicle_id,
      mod_item_id: originalMod.mod_item_id,
      notes: originalMod.notes ? `${originalMod.notes} (Copy)` : 'Mod (Copy)',
      status: 'planned', // Default to planned
      cost: originalMod.cost,
      // We don't copy specific event dates usually for new plans
    })
    .select()
    .single()

  if (modError) {
    return { success: false, error: 'Failed to create new mod.' }
  }

  // 3. Create new mod plan
  const { data: newModPlan, error: jobError } = await supabase
    .from('mod_plans')
    .insert({
      user_id: userId,
      mod_log_id: newMod.id,
      name: newName,
    })
    .select()
    .single()

  if (jobError) {
    return { success: false, error: 'Failed to create new mod plan.' }
  }

  // 4. Fetch original steps
  const { data: steps, error: stepsError } = await supabase
    .from('mod_steps')
    .select('*')
    .eq('mod_plan_id', originalModPlanId)
    .order('step_order', { ascending: true })

  if (stepsError) {
    return { success: false, error: 'Failed to fetch original steps.' }
  }

  // 5. Copy steps to new plan
  if (steps && steps.length > 0) {
    const newSteps = steps.map(step => ({
      mod_plan_id: newModPlan.id,
      step_order: step.step_order,
      description: step.description,
      notes: step.notes,
      is_completed: false, // Reset completion
      is_completed_reassembly: false,
    }))

    const { error: copyError } = await supabase
      .from('mod_steps')
      .insert(newSteps)

    if (copyError) {
      return { success: false, error: 'Failed to copy steps.' }
    }
  }

  revalidatePath('/vehicle/[id]/mods', 'page') // Revalidate list to see new mod
  return { success: true, data: { plan: newModPlan, modId: newMod.id } }
}

export async function updateModPlanName(modPlanId: string, newName: string, userId: string) {
    const supabase = await createClient()

    const { error } = await supabase
      .from('mod_plans')
      .update({ name: newName })
      .eq('id', modPlanId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating mod plan name:', error)
      throw new Error('Failed to update mod plan name')
    }

    revalidatePath('/vehicle/[id]/mods/[modId]', 'page')
}
