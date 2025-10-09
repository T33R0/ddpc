import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/?error=auth_callback_error', request.url));
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(new URL('/?error=auth_callback_error', request.url));
    }

    // Ensure user profile exists
    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_profile')
        .upsert({
          user_id: data.user.id,
          username: data.user.email?.split('@')[0] || `user_${data.user.id.slice(0, 8)}`,
          display_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
          email: data.user.email,
          is_public: true,
          role: 'user',
          plan: 'free',
          banned: false,
        }, {
          onConflict: 'user_id'
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        // Don't fail the auth flow for profile creation errors
      }
    }

    // Redirect to account on success
    return NextResponse.redirect(new URL('/account', request.url));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/?error=auth_callback_error', request.url));
  }
}
