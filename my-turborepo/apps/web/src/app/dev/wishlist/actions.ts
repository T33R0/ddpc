'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPlannedItem(formData: FormData) {
  const description = formData.get('description') as string
  const costPlanned = formData.get('cost_planned') as string

  const supabase = await createClient()

  const { error } = await supabase
    .from('cul_build_items')
    .insert({
      description,
      cost_planned: parseFloat(costPlanned),
      status: 'planned',
    })

  if (error) {
    console.error('Error creating planned item:', error)
    throw new Error('Failed to create planned item')
  }

  revalidatePath('/dev/wishlist')
}

export async function completePlannedItem(itemId: string, formData: FormData) {
  const costActual = formData.get('cost_actual') as string
  const dateCompleted = formData.get('date_completed') as string

  const supabase = await createClient()

  const { error } = await supabase
    .from('cul_build_items')
    .update({
      status: 'completed',
      cost_actual: parseFloat(costActual),
      date_completed: dateCompleted,
    })
    .eq('id', itemId)

  if (error) {
    console.error('Error completing item:', error)
    throw new Error('Failed to complete item')
  }

  revalidatePath('/dev/wishlist')
}


