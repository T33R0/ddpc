'use server'

import { createClient } from '@/lib/supabase/server'

export async function getHistoryFilters(): Promise<string[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return ['maintenance', 'fuel', 'modification', 'mileage']

    try {
        const { data, error } = await supabase
            .from('user_preferences')
            .select('history_filters')
            .eq('user_id', user.id)
            .single()

        if (error || !data?.history_filters) {
            return ['maintenance', 'fuel', 'modification', 'mileage']
        }

        return data.history_filters as string[]
    } catch (err) {
        console.error('Error fetching history filters:', err)
        return ['maintenance', 'fuel', 'modification', 'mileage']
    }
}

export async function updateHistoryFilters(filters: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    try {
        await supabase
            .from('user_preferences')
            .upsert({
                user_id: user.id,
                history_filters: filters,
                updated_at: new Date().toISOString()
            })
    } catch (err) {
        console.error('Error updating history filters:', err)
        throw new Error('Failed to save preferences')
    }
}
