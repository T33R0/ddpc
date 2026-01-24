'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleVehiclePrivacy(vehicleId: string, currentPrivacy: string) {
    const supabase = await createClient()

    // Get current user to ensure ownership
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Unauthorized')
    }

    const newPrivacy = currentPrivacy === 'PRIVATE' ? 'PUBLIC' : 'PRIVATE'

    const { error } = await supabase
        .from('user_vehicle')
        .update({ privacy: newPrivacy })
        .eq('id', vehicleId)
        .eq('owner_id', user.id)

    if (error) {
        console.error('Error toggling vehicle privacy:', error)
        throw new Error('Failed to update privacy settings')
    }

    revalidatePath(`/vehicle/${vehicleId}`)
    return { success: true, newPrivacy }
}

export async function logJobAction(formData: FormData) {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Unauthorized')
    }

    const vehicleId = formData.get('vehicleId') as string
    const title = formData.get('title') as string
    const date = formData.get('date') as string
    const type = formData.get('type') as string
    const odometer = Number(formData.get('odometer'))
    const cost = Number(formData.get('cost'))
    const vendor = formData.get('vendor') as string
    const notes = formData.get('notes') as string

    if (!vehicleId || !title || !date || !type) {
        throw new Error('Missing required fields')
    }

    const { error } = await supabase
        .from('jobs')
        .insert({
            vehicle_id: vehicleId,
            user_id: user.id,
            title,
            date_completed: date, // mapped to date_completed
            type,
            odometer,
            cost_total: cost, // mapped to cost_total
            vendor,
            notes, // notes is just text, mapped to notes column if exists or description? CHECK SCHEMA. 
            // User request said: "Table jobs: ... notes".
            status: 'completed'
        })

    if (error) {
        console.error('Error logging job:', error)
        return { success: false, error: error.message || 'Failed to log job' }
    }

    revalidatePath(`/vehicle/${vehicleId}`)
    return { success: true }
}

export async function updateVehicleConfig(vehicleId: string, data: {
    nickname?: string
    vin?: string
    status?: string
    privacy?: 'PUBLIC' | 'PRIVATE'
    color?: string
    vehicleImage?: string
    acquisitionDate?: string
    acquisitionCost?: number
    acquisitionType?: string
    ownershipEndDate?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const updates: any = {}
    if (data.nickname !== undefined) updates.nickname = data.nickname
    if (data.vin !== undefined) updates.vin = data.vin
    if (data.status !== undefined) updates.current_status = data.status
    if (data.privacy !== undefined) updates.privacy = data.privacy
    if (data.color !== undefined) updates.vehicle_color = data.color
    if (data.vehicleImage !== undefined) updates.vehicle_image = data.vehicleImage
    if (data.acquisitionDate !== undefined) updates.acquisition_date = data.acquisitionDate || null
    if (data.acquisitionCost !== undefined) updates.acquisition_cost = data.acquisitionCost
    if (data.acquisitionType !== undefined) updates.acquisition_type = data.acquisitionType
    if (data.ownershipEndDate !== undefined) updates.ownership_end_date = data.ownershipEndDate || null

    const { error } = await supabase
        .from('user_vehicle')
        .update(updates)
        .eq('id', vehicleId)
        .eq('owner_id', user.id)

    if (error) {
        console.error('Error updating vehicle config:', error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/vehicle/${vehicleId}`)
    return { success: true }
}
