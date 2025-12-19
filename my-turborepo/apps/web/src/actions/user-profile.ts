'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateUserTheme(theme: 'light' | 'dark' | 'auto') {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        console.error('updateUserTheme: User not authenticated', authError);
        return { success: false, error: 'User not authenticated' };
    }

    try {
        const { error } = await supabase
            .from('user_profile')
            .update({ theme })
            .eq('user_id', user.id);

        if (error) {
            console.error('updateUserTheme: DB Error', error);
            return { success: false, error: error.message };
        }

        console.log(`updateUserTheme: Successfully updated theme to ${theme} for user ${user.id}`);

        // Revalidate relevant paths if needed, though theme is client-side state mostly
        // revalidatePath('/');

        return { success: true };
    } catch (err) {
        console.error('updateUserTheme: Unexpected error', err);
        return { success: false, error: 'Unexpected error occurred' };
    }
}

export async function getUserTheme() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { theme: 'dark' };

    try {
        const { data, error } = await supabase
            .from('user_profile')
            .select('theme')
            .eq('user_id', user.id)
            .single();

        if (error) {
            // It's common to not have a profile yet or RLS error, defaulting is safe
            return { theme: 'dark' };
        }

        // Ensure valid value
        const theme = data?.theme;
        if (theme && ['light', 'dark', 'auto'].includes(theme)) {
            return { theme };
        }

        return { theme: 'dark' };
    } catch (err) {
        console.error('getUserTheme: Unexpected error', err);
        return { theme: 'dark' };
    }
}
