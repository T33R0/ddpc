'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ModStepData } from './types'
import { z } from 'zod'

export type ModActionResponse = {
  success: boolean
  error?: string
  data?: any
  details?: { message?: string; path?: (string | number)[] }[]
}

const uuidSchema = z.string().uuid()
const strMin1 = z.string().min(1, 'Cannot be empty')

export async function addModStep(modPlanId: string, description: string, stepOrder: number) {
  const schema = z.object({
    modPlanId: uuidSchema,
    description: strMin1,
    stepOrder: z.number().int()
  })

  const validation = schema.safeParse({ modPlanId, description, stepOrder })
  if (!validation.success) {
    throw new Error('Invalid input: ' + validation.error.message)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Ideally verify modPlanId belongs to user, but relying on RLS + Auth check for now
  // We can check if the plan belongs to the user
  const { data: plan } = await supabase.from('mod_plans').select('user_id').eq('id', modPlanId).single()
  if (plan && plan.user_id !== user.id) {
    throw new Error('Unauthorized access to mod plan')
  }

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
  const safeUpdatesSchema = z.object({
      step_order: z.number().int().optional(),
      description: z.string().optional(),
      notes: z.string().nullable().optional(),
      is_completed: z.boolean().optional(),
      is_completed_reassembly: z.boolean().optional(),
  })

  if (!uuidSchema.safeParse(stepId).success) throw new Error('Invalid Step ID')

  const updateValidation = safeUpdatesSchema.safeParse(updates)
  if (!updateValidation.success) throw new Error('Invalid updates')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('mod_steps')
    .update(updateValidation.data)
    .eq('id', stepId)

  if (error) {
    console.error('Error updating mod step:', error)
    throw new Error('Failed to update mod step')
  }

  revalidatePath('/vehicle/[id]/mods/[modId]', 'page')
}

export async function duplicateModStep(stepId: string): Promise<ModActionResponse> {
  if (!uuidSchema.safeParse(stepId).success) return { success: false, error: 'Invalid Step ID' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // 1. Fetch the step to duplicate
  const { data: step, error: stepError } = await supabase
    .from('mod_steps')
    .select('*, mod_plans(user_id)')
    .eq('id', stepId)
    .single()

  if (stepError || !step) {
    return { success: false, error: 'Step not found' }
  }

  // Check ownership
  if (step.mod_plans && (step.mod_plans as { user_id: string }).user_id !== user.id) {
     return { success: false, error: 'Unauthorized' }
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
  if (!uuidSchema.safeParse(stepId).success) throw new Error('Invalid Step ID')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

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
  const schema = z.array(z.object({
    id: uuidSchema,
    step_order: z.number().int()
  }))

  const validation = schema.safeParse(updates)
  if (!validation.success) throw new Error('Invalid input')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

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

export async function fetchOrCreateModPlanAction(modLogId: string, userId: string, modTitle: string): Promise<{ id: string | null, error?: string }> {
  const schema = z.object({
    modLogId: uuidSchema,
    userId: uuidSchema,
    modTitle: z.string()
  })

  if (!schema.safeParse({ modLogId, userId, modTitle }).success) {
      return { id: null, error: 'Invalid input' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { id: null, error: 'Unauthorized' }
  if (user.id !== userId) return { id: null, error: 'Unauthorized user mismatch' }

  try {
    // 1. Check if plan exists
    const { data: existingPlan, error: fetchError } = await supabase
      .from('mod_plans')
      .select('id')
      .eq('mod_log_id', modLogId)
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError && fetchError.code !== 'PGRST116') {
       console.error('Error fetching mod plan:', fetchError)
       return { id: null, error: fetchError.message }
    }

    if (existingPlan) {
      return { id: existingPlan.id }
    }

    // 2. Create if not exists
    const { data: newPlan, error: createError } = await supabase
      .from('mod_plans')
      .insert({
        user_id: userId,
        mod_log_id: modLogId,
        name: modTitle,
      })
      .select('id')
      .maybeSingle()

    if (createError) {
      console.error('Error creating mod plan:', createError)
      return { id: null, error: createError.message }
    }

    if (!newPlan) {
        return { id: null, error: 'Failed to create plan (no data returned)' }
    }

    revalidatePath('/vehicle/[id]/mods/[modId]', 'page')
    return { id: newPlan.id }
  } catch (err) {
    console.error('Unexpected error in fetchOrCreateModPlanAction:', err)
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return { id: null, error: message }
  }
}

export async function duplicateModPlan(originalModPlanId: string, newName: string, userId: string, targetModId: string): Promise<ModActionResponse> {
  const schema = z.object({
      originalModPlanId: uuidSchema,
      newName: strMin1,
      userId: uuidSchema,
      targetModId: uuidSchema.optional().or(z.string())
  })

  if (!schema.safeParse({ originalModPlanId, newName, userId, targetModId }).success) {
      return { success: false, error: 'Invalid input' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  if (user.id !== userId) return { success: false, error: 'Unauthorized user mismatch' }

  // 1. Fetch original mod plan details
  const { data: originalPlan, error: planError } = await supabase
    .from('mod_plans')
    .select('*')
    .eq('id', originalModPlanId)
    .single()

  if (planError || !originalPlan) {
    return { success: false, error: 'Original mod plan not found.' }
  }

  if (originalPlan.user_id !== user.id) {
       return { success: false, error: 'Unauthorized access to original plan' }
  }

  // Fetch original mod to duplicate it first
  const { data: originalMod } = await supabase
    .from('mods')
    .select('*')
    .eq('id', originalPlan.mod_log_id)
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

  revalidatePath('/vehicle/[id]/mods', 'page')
  return { success: true, data: { plan: newModPlan, modId: newMod.id } }
}

export async function updateModPlanName(modPlanId: string, newName: string, userId: string) {
    const schema = z.object({
        modPlanId: uuidSchema,
        newName: strMin1,
        userId: uuidSchema
    })

    if (!schema.safeParse({ modPlanId, newName, userId }).success) {
        throw new Error('Invalid input')
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    if (user.id !== userId) throw new Error('Unauthorized user mismatch')

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
