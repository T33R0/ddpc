'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { VehiclePrivacySettings } from '@/lib/vehicle-privacy-filter'

const privacySettingsSchema = z.object({
  show_odometer: z.boolean().optional(),
  show_cost: z.boolean().optional(),
  show_maintenance_history: z.boolean().optional(),
  show_fuel_logs: z.boolean().optional(),
  show_mods: z.boolean().optional(),
  show_parts: z.boolean().optional(),
  show_vin: z.boolean().optional(),
})

export async function updateVehiclePrivacySettings(
  vehicleId: string,
  settings: Partial<VehiclePrivacySettings>
) {
  const vehicleIdParse = z.string().uuid().safeParse(vehicleId)
  if (!vehicleIdParse.success) {
    return { error: 'Invalid Vehicle ID' }
  }

  const settingsParse = privacySettingsSchema.safeParse(settings)
  if (!settingsParse.success) {
    return { error: 'Invalid privacy settings' }
  }

  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Unauthorized' }
    }

    // Fetch current vehicle to check ownership and get existing settings
    const { data: vehicle, error: fetchError } = await supabase
      .from('user_vehicle')
      .select('id, owner_id, privacy_settings')
      .eq('id', vehicleId)
      .single()

    if (fetchError || !vehicle) {
      return { error: 'Vehicle not found' }
    }

    if (vehicle.owner_id !== user.id) {
      return { error: 'Unauthorized' }
    }

    // Merge new settings with existing (partial update)
    const existingSettings = (vehicle.privacy_settings || {}) as Record<string, unknown>
    const mergedSettings = { ...existingSettings, ...settingsParse.data }

    const { error: updateError } = await supabase
      .from('user_vehicle')
      .update({ privacy_settings: mergedSettings })
      .eq('id', vehicleId)

    if (updateError) {
      console.error('Error updating privacy settings:', updateError)
      return { error: 'Failed to update privacy settings' }
    }

    revalidatePath(`/vehicle/${vehicleId}`)

    return { success: true, settings: mergedSettings }
  } catch (error) {
    console.error('Unexpected error updating privacy settings:', error)
    return { error: 'An unexpected error occurred' }
  }
}
