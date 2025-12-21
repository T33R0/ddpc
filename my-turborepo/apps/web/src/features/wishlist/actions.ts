'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Schemas
export const WishlistItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().optional().nullable(),
  price: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']),
  type: z.enum(['mod', 'service']),
  category: z.string().optional().nullable(),
  vehicle_id: z.string().uuid(),
})

export type WishlistItemInput = z.infer<typeof WishlistItemSchema>

export async function getWishlistItems(vehicleId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching wishlist:', error)
    return []
  }
  return data || []
}

export async function createWishlistItem(data: WishlistItemInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Unauthorized' }

  const parse = WishlistItemSchema.safeParse(data)
  if (!parse.success) {
    return { success: false, error: parse.error.issues[0]?.message || 'Invalid input' }
  }

  const { error } = await supabase
    .from('wishlist_items')
    .insert({
      ...data,
      user_id: user.id
    })

  if (error) {
    console.error('Error creating wishlist item:', error)
    return { success: false, error: 'Failed to create item' }
  }

  revalidatePath(`/vehicle/${data.vehicle_id}`)
  return { success: true }
}

export async function deleteWishlistItem(id: string, vehicleId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: 'Failed to delete item' }
  }

  revalidatePath(`/vehicle/${vehicleId}`)
  return { success: true }
}

export async function purchaseWishlistItem(id: string, vehicleId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Unauthorized' }

  // 1. Fetch item
  const { data: item, error: fetchError } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !item) {
    return { success: false, error: 'Item not found' }
  }

  if (item.status === 'purchased') {
    return { success: false, error: 'Item already purchased' }
  }

  // 2. Add to part_inventory
  // We handle potential nulls for numeric/text fields
  const { error: inventoryError } = await supabase
    .from('part_inventory')
    .insert({
      user_id: user.id,
      name: item.name,
      vendor_link: item.url || null,
      cost: item.price || null,
      quantity: 1,
      category: item.category || null,
    })

  if (inventoryError) {
    console.error('Inventory error:', inventoryError)
    return { success: false, error: 'Failed to add to inventory' }
  }

  // 3. Update status
  const { error: updateError } = await supabase
    .from('wishlist_items')
    .update({ status: 'purchased' })
    .eq('id', id)

  if (updateError) {
    return { success: false, error: 'Failed to update status' }
  }

  revalidatePath(`/vehicle/${vehicleId}`)
  return { success: true }
}

export async function getModCategories() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('mod_categories')
    .select('name')
    .order('name')

  return data?.map(d => d.name) || []
}

export async function getServiceCategories() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('service_categories')
    .select('name')
    .order('name')

  return data?.map(d => d.name) || []
}
