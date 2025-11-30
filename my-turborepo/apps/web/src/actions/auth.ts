'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signOut() {
    const supabase = await createClient();

    // 1. Sign out on the server (invalidates session in Supabase & clears cookie)
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error('Logout failed:', error);
    }

    // 2. Force redirect to landing
    // This redirect carries the "Set-Cookie: max-age=0" header to the browser
    return redirect('/?loggedOut=true');
}
