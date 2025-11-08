import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Helper function to generate a random suffix
function createRandomSuffix(length = 4) {
  return Math.random().toString(36).substring(2, 2 + length)
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/garage' // Default redirect to garage

  if (code) {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error (exchangeCodeForSession):', error)
      return NextResponse.redirect(`${origin}/auth/auth-code-error`)
    }

    // --- USERNAME UNIQUENESS FIX (NEW LOGIC) ---

    if (user) {
      // 1. Attempt to create the user profile with the email prefix as username
      const emailPrefix = user.email?.split('@')[0] || createRandomSuffix(8)
      const username = emailPrefix.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() // Sanitize

      const profileData = {
        user_id: user.id,
        username: username,
        display_name: user.user_metadata?.full_name || emailPrefix,
        avatar_url: user.user_metadata?.avatar_url,
        // Set defaults from your schema
        role: 'user',
        plan: 'free',
        is_public: true,
      }

      // 2. Attempt to upsert the profile.
      // `ignoreDuplicates: false` is crucial. We *want* to know about the conflict.
      const { error: profileError } = await supabase
        .from('user_profile')
        .insert(profileData)

      // 3. Check for the specific "unique violation" error
      if (profileError && profileError.code === '23505') { // 23505 = unique_violation
        // This username is taken. Retry ONCE with a random suffix.
        console.warn(`Username collision for: ${username}. Retrying with suffix.`)
        profileData.username = `${username}_${createRandomSuffix()}`

        const { error: retryError } = await supabase
          .from('user_profile')
          .insert(profileData)

        if (retryError) {
          // This should not happen, but if it does, log it.
          console.error('FATAL: Auth callback profile retry failed:', retryError)
          // Don't block the redirect
        }
      } else if (profileError) {
        // Some other error occurred
        console.error('Auth callback profile insert error:', profileError)
        // Don't block the redirect
      }
    }

    // --- END OF NEW LOGIC ---

    return NextResponse.redirect(`${origin}${next}`)
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
