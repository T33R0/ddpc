import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

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

      // --- NEW USER NOTIFICATION ---
      // If we successfully processed the user (regardless of profile insert outcome,
      // as long as we have a user), we should check if this is a NEW sign up.
      // The `exchangeCodeForSession` doesn't explicitly tell us if it's a new user,
      // but if we just tried to insert the profile and it succeeded (or failed with non-duplicate),
      // it's likely a new user flow or first login.
      // However, for robustness, we can check if the profile was JUST created.
      // A better approach is: if we reached the profile creation block, it means we
      // suspect a new user.
      // To be safe, we can check if the user was created very recently.
      const isNewUser = user.created_at && (new Date().getTime() - new Date(user.created_at).getTime() < 60000); // Created within last minute

      if (isNewUser) {
        try {
          // Find admins to notify
          const { data: admins } = await supabase
            .from('user_profile')
            .select('user_id') // We need to get email from auth.users, but we can't join easily here.
                               // Wait, we need the email to send TO.
                               // We can't query auth.users directly via client.
                               // We need to rely on the fact that we might not have admin emails easily accessible
                               // unless we store them or use a service key to query auth.admin.listUsers().
            .eq('role', 'admin')
            .eq('notify_on_new_user', true);

          if (admins && admins.length > 0) {
             // We need to fetch emails for these admins.
             // Using service role to fetch user data.
             const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
             if (serviceRoleKey) {
                 const adminClient = await createClient(); // This uses default headers, need explicit service client if possible or use auth.admin
                 // Actually, `createClient` in `lib/supabase/server` uses cookies.
                 // We need a raw supabase-js client for admin operations if the current user isn't admin.
                 // But wait, we are in a route handler, `createClient` is context aware.
                 // We need a separate admin client.
                 const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
                 const supabaseAdmin = createSupabaseClient(
                     process.env.NEXT_PUBLIC_SUPABASE_URL!,
                     serviceRoleKey,
                     { auth: { autoRefreshToken: false, persistSession: false } }
                 );

                 const adminIds = admins.map(a => a.user_id);
                 // Unfortunately listUsers doesn't support "in" filter easily for IDs in one go efficiently for large sets,
                 // but for a few admins it's fine to just list all or iterate.
                 // Better: Use `supabaseAdmin.auth.admin.listUsers()` and filter? No, inefficient.
                 // Since we don't have many admins, we can iterate or use a stored procedure if strictly needed.
                 // But actually, we might have `email` in `user_profile`? No, we don't store it there usually.
                 // Let's check `user_profile` definition from previous `read_file` of `route.ts`.
                 // It returns `email: user.email` from the auth user object, implying it's not in the table.
                 // BUT, for the purpose of this task, we can assume we might need to get it.
                 // However, the `user_profile` table might NOT have email.
                 // Let's assume we can just fetch all users and filter in memory (bad for scale, good for MVP with few admins).
                 // OR, we can just assume a fixed admin email if it was configured? No, requirement says "toggled by admins".

                 // Let's try to fetch user emails by ID.
                 const { data: { users: allUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

                 if (!listError && allUsers) {
                     const adminEmails = allUsers
                         .filter(u => adminIds.includes(u.id) && u.email)
                         .map(u => u.email as string);

                     if (adminEmails.length > 0) {
                         await sendEmail({
                             to: adminEmails,
                             subject: 'New User Signup - DDPC',
                             html: `<p>A new user has signed up!</p><p><strong>Email:</strong> ${user.email}</p><p><strong>ID:</strong> ${user.id}</p>`
                         });
                     }
                 }
             }
          }
        } catch (notifyError) {
          console.error('Failed to send new user notification:', notifyError);
        }
      }
    }

    // --- END OF NEW LOGIC ---

    return NextResponse.redirect(`${origin}${next}`)
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
