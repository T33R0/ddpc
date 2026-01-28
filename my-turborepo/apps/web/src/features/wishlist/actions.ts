'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { WishlistItemSchema, WishlistItemInput } from './schema'

// Migrated to 'inventory' table
export async function getWishlistItems(vehicleId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('vehicle_id', vehicleId)
      // Fetch all relevant statuses.
      .in('status', ['wishlist', 'ordered'])
      .order('priority', { ascending: false })

    if (error) {
      console.error('Error fetching wishlist:', error)
      return []
    }
    return data || []
  } catch (err) {
    console.error('Exception fetching wishlist:', err)
    return []
  }
}

export async function createWishlistItem(data: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    // Map input to inventory table columns
    const { error } = await supabase
      .from('inventory')
      .insert({
        vehicle_id: data.vehicle_id,
        user_id: user.id, // Add user_id for RLS
        name: data.name,
        category: data.category || null,
        purchase_url: data.url,
        purchase_price: data.price,
        quantity: data.quantity || 1, // Default to 1
        purchased_at: data.purchased_at || null,
        priority: data.priority, // 1-5
        status: data.status || 'wishlist', // Default to wishlist
        tracking_number: data.tracking_number || null,
        carrier: data.carrier || null
      })

    if (error) {
      console.error('Error creating wishlist item:', error)
      return { success: false, error: 'Failed to create item' }
    }

    revalidatePath(`/vehicle/${data.vehicle_id}`)
    return { success: true }
  } catch (err) {
    console.error('Exception creating wishlist item:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function deleteWishlistItem(id: string, vehicleId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting wishlist item:', error)
      if (error.code === '23503') {
        return { success: false, error: 'Cannot delete this part because it is attached to a job. Please remove it from the job first.' }
      }
      return { success: false, error: 'Failed to delete item' }
    }

    revalidatePath(`/vehicle/${vehicleId}`)
    return { success: true }
  } catch (err) {
    console.error('Exception deleting wishlist item:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function updateWishlistItem(id: string, data: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { error } = await supabase
      .from('inventory')
      .update({
        name: data.name,
        category: data.category || null,
        purchase_url: data.url,
        purchase_price: data.price,
        quantity: data.quantity,
        purchased_at: data.purchased_at,
        priority: data.priority,
        status: data.status,
        tracking_number: data.tracking_number,
        carrier: data.carrier
      })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure ownership

    if (error) {
      console.error('Error updating wishlist item:', error)
      return { success: false, error: 'Failed to update item' }
    }

    revalidatePath(`/vehicle/${data.vehicle_id}`)
    return { success: true }
  } catch (err) {
    console.error('Exception updating wishlist item:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function purchaseWishlistItem(id: string, vehicleId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // Check if item exists
    const { error } = await supabase
      .from('inventory')
      .update({ status: 'ordered' }) // Update to 'ordered' as requested
      .eq('id', id)
      .eq('user_id', user.id) // Ensure ownership

    if (error) {
      console.error('Error purchasing item:', error)
      return { success: false, error: 'Failed to update status' }
    }

    revalidatePath(`/vehicle/${vehicleId}`)
    return { success: true }
  } catch (err) {
    console.error('Exception purchasing item:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function getModCategories() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('mod_categories')
      .select('name')
      .order('name')

    if (error) {
      console.error('Error fetching mod categories:', error)
      return []
    }
    return data?.map(d => d.name) || []
  } catch (err) {
    console.error('Exception fetching mod categories:', err)
    return []
  }
}

export async function getServiceCategories() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('service_categories')
      .select('name')
      .order('name')

    if (error) {
      console.error('Error fetching service categories:', error)
      return []
    }
    return data?.map(d => d.name) || []
  } catch (err) {
    console.error('Exception fetching service categories:', err)
    return []
  }
}
