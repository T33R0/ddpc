'use server'

import { createClient } from '@/lib/supabase/server'

export async function getUserCars() {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return []
  }

  const { data: cars, error } = await supabase
    .from('cul_cars')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching cars:', error)
    return []
  }

  return cars || []
}

