import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { render } from '@react-email/render'
import { WelcomeEmail } from '@/emails/WelcomeEmail'
import React from 'react'

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

    if (user) {
      // 1. Check if profile already exists to prevent PK violations and overwriting data
      const { data: existingProfile } = await supabase
        .from('user_profile')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      // Only attempt creation if profile does not exist
      if (!existingProfile) {
        // 2. Attempt to create the user profile with the email prefix as username
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

        // 3. Attempt to insert the profile.
        // We use insert because we know it doesn't exist (unless race condition).
        const { error: profileError } = await supabase
          .from('user_profile')
          .insert(profileData)

        let profileCreated = false

        // 4. Check for unique violation (likely username collision since we checked user_id)
        if (profileError && profileError.code === '23505') {
          // This username is taken. Retry ONCE with a random suffix.
          console.warn(`Username collision for: ${username}. Retrying with suffix.`)
          profileData.username = `${username}_${createRandomSuffix()}`

          const { error: retryError } = await supabase
            .from('user_profile')
            .insert(profileData)

          if (retryError) {
            console.error('FATAL: Auth callback profile retry failed:', retryError)
          } else {
            profileCreated = true
          }
        } else if (profileError) {
          console.error('Auth callback profile insert error:', profileError)
        } else {
          profileCreated = true
        }

        // Send welcome email if profile was successfully created
        if (profileCreated && user.email) {
          try {
            // Plain text version of the welcome email
            const emailText = `DDPC // GARAGE

Welcome to the Build.

You've just completed an important step. Great work.

We built ddpc for the people who actually turn wrenches and track miles. Since you're here to build, not just browse, here are the best ways to break in your new account:

1. PARK IT
Add your first vehicle to the Garage. Even if it's stock (for now).

2. LOG IT
Document your last maintenance item or mod. Data is leverage.

Enter Garage: https://ddpc.app/garage

Just lean into your tinkerer brain and figure it out.

---

ddpc // Fort Collins, CO`

            // render() needs the React element - use createElement for server-side
            const emailHtml = await render(React.createElement(WelcomeEmail))
            
            // Debug: log first 500 chars of HTML to verify rendering
            console.log('[Welcome Email] Rendered HTML preview:', emailHtml.substring(0, 500))
            console.log('[Welcome Email] Rendered HTML length:', emailHtml.length)
            
            // Send email with both HTML and plain text versions
            await sendEmail({
              to: user.email,
              subject: 'Welcome to the Build',
              html: emailHtml || emailText.replace(/\n/g, '<br>'), // Fallback to text if HTML is empty
              text: emailText,
            })
            console.log('[Welcome Email] Sent welcome email to new user:', user.email)
          } catch (welcomeEmailError) {
            console.error('[Welcome Email] Failed to send welcome email:', welcomeEmailError)
            // Don't fail the auth flow if email fails
          }
        }

        // --- NEW USER NOTIFICATION ---
        // Only trigger for genuinely new profiles
        try {
          // Find admins to notify
          const { data: admins } = await supabase
            .from('user_profile')
            .select('user_id')
            .eq('role', 'admin')
            .eq('notify_on_new_user', true);

          if (admins && admins.length > 0) {
            const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (serviceRoleKey) {
              const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
              const supabaseAdmin = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                serviceRoleKey,
                { auth: { autoRefreshToken: false, persistSession: false } }
              );

              const adminIds = admins.map(a => a.user_id);
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

    return NextResponse.redirect(`${origin}${next}`)
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
