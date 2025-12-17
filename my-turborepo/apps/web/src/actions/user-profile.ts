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
