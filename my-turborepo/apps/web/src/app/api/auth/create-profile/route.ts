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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const userId = body.userId as string | undefined

    const supabase = await createClient()
    let user = null
    let useAdminClient = false

    // Try to get user from session first
    const { data: { user: sessionUser } } = await supabase.auth.getUser()
    if (sessionUser) {
      user = sessionUser
    } else if (userId) {
      // If no session but userId provided, use service role to fetch user
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (serviceRoleKey) {
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        const supabaseAdmin = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey,
          { auth: { autoRefreshToken: false, persistSession: false } }
        )
        const { data: { user: adminUser } } = await supabaseAdmin.auth.admin.getUserById(userId)
        if (adminUser) {
          user = adminUser
          useAdminClient = true
          // Replace supabase with admin client for database operations
          Object.assign(supabase, supabaseAdmin)
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Use admin client if we're working with an unconfirmed user
    const dbClient = useAdminClient && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? (await import('@supabase/supabase-js')).createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
      : supabase

    // Check if profile already exists
    const { data: existingProfile } = await dbClient
      .from('user_profile')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingProfile) {
      // Profile already exists, return success
      return NextResponse.json({ success: true, message: 'Profile already exists' })
    }

    // Create the profile
    const emailPrefix = user.email?.split('@')[0] || createRandomSuffix(8)
    const username = emailPrefix.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()

    const profileData = {
      user_id: user.id,
      username: username,
      display_name: user.user_metadata?.full_name || emailPrefix,
      avatar_url: user.user_metadata?.avatar_url,
      role: 'user',
      plan: 'free',
      is_public: true,
    }

    const { error: profileError } = await dbClient
      .from('user_profile')
      .insert(profileData)

    let profileWasCreated = false

    // Handle username collision
    if (profileError && profileError.code === '23505') {
      console.warn(`Username collision for: ${username}. Retrying with suffix.`)
      profileData.username = `${username}_${createRandomSuffix()}`

      const { error: retryError } = await dbClient
        .from('user_profile')
        .insert(profileData)

      if (retryError) {
        console.error('Profile creation retry failed:', retryError)
        return NextResponse.json(
          { error: 'Failed to create profile', details: retryError.message },
          { status: 500 }
        )
      } else {
        profileWasCreated = true
      }
    } else if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json(
        { error: 'Failed to create profile', details: profileError.message },
        { status: 500 }
      )
    } else {
      profileWasCreated = true
    }

    // Send welcome email if profile was successfully created
    if (profileWasCreated && user.email) {
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

Enter Garage: https://myddpc.com/garage

Just lean into your tinkerer brain and figure it out.

---

ddpc // Fort Collins, CO`

        // Simple HTML version from plain text (as fallback)
        const simpleHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000; color: #fff;">
  <div style="text-align: center; font-family: monospace; font-size: 20px; letter-spacing: 0.2em; font-weight: bold; margin-top: 32px; color: #fff;">
    DDPC // GARAGE
  </div>
  
  <h1 style="color: #fff; font-size: 24px; font-weight: bold; text-align: center; margin: 30px 0;">
    Welcome to the Build.
  </h1>
  
  <p style="color: #d4d4d4; font-size: 14px; line-height: 24px;">
    You've just completed an important step. Great work.
  </p>
  
  <p style="color: #d4d4d4; font-size: 14px; line-height: 24px;">
    We built ddpc for the people who actually turn wrenches and track miles. Since you're here to build, not just browse, here are the best ways to break in your new account:
  </p>
  
  <div style="margin: 20px 0;">
    <div style="background-color: #171717; padding: 16px; border-radius: 4px; border: 1px solid #262626; margin-bottom: 10px;">
      <p style="color: #dc2626; font-weight: bold; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em;">1. PARK IT</p>
      <p style="color: #a3a3a3; font-size: 12px; margin: 0; line-height: 18px;">
        Add your first vehicle to the Garage. Even if it's stock (for now).
      </p>
    </div>
    
    <div style="background-color: #171717; padding: 16px; border-radius: 4px; border: 1px solid #262626;">
      <p style="color: #dc2626; font-weight: bold; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em;">2. LOG IT</p>
      <p style="color: #a3a3a3; font-size: 12px; margin: 0; line-height: 18px;">
        Document your last maintenance item or mod. Data is leverage.
      </p>
    </div>
  </div>
  
  <div style="text-align: center; margin: 32px 0;">
    <a href="https://myddpc.com/garage" style="background-color: #fff; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block;">
      Enter Garage
    </a>
  </div>
  
  <p style="color: #737373; font-size: 12px; line-height: 24px; text-align: center;">
    Just lean into your tinkerer brain and figure it out.
  </p>
  
  <hr style="border: none; border-top: 1px solid #262626; margin: 26px 0; width: 100%;">
  
  <p style="color: #525252; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; text-align: center;">
    ddpc // Fort Collins, CO
  </p>
</body>
</html>`

        // Try to render React Email component
        let emailHtml = ''
        try {
          emailHtml = await render(React.createElement(WelcomeEmail))
          
          // Debug: log first 500 chars of HTML to verify rendering
          console.log('[Welcome Email] Rendered HTML preview:', emailHtml.substring(0, 500))
          console.log('[Welcome Email] Rendered HTML length:', emailHtml.length)
          
          // Check if HTML is actually empty or just contains DOCTYPE/meta tags
          // If it's less than 500 chars or doesn't contain body content, use simple HTML
          const hasBodyContent = emailHtml.includes('<body') && emailHtml.includes('</body>') && 
                                 emailHtml.length > emailHtml.indexOf('</body>') + 100
          
          if (!hasBodyContent || emailHtml.length < 500) {
            console.warn('[Welcome Email] React Email HTML appears empty, using simple HTML fallback')
            emailHtml = simpleHtml
          }
        } catch (renderError) {
          console.error('[Welcome Email] React Email render failed, using simple HTML fallback:', renderError)
          emailHtml = simpleHtml
        }
        
        // Send email with both HTML and plain text versions
        await sendEmail({
          to: user.email,
          subject: 'Welcome to the Build',
          html: emailHtml || simpleHtml,
          text: emailText,
        })
        console.log('[Welcome Email] Sent welcome email to new user:', user.email)
      } catch (welcomeEmailError) {
        console.error('[Welcome Email] Failed to send welcome email:', welcomeEmailError)
        // Don't fail profile creation if email fails
      }
    }

    // Send admin notification if profile was successfully created
    if (profileWasCreated) {
      try {
        // Find admins to notify
        const { data: admins } = await dbClient
          .from('user_profile')
          .select('user_id')
          .eq('role', 'admin')
          .eq('notify_on_new_user', true)

        if (admins && admins.length > 0) {
          const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
          if (serviceRoleKey) {
            const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
            const supabaseAdmin = createSupabaseClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              serviceRoleKey,
              { auth: { autoRefreshToken: false, persistSession: false } }
            )

            const adminIds = admins.map(a => a.user_id)
            const { data: { users: allUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })

            if (!listError && allUsers) {
              const adminEmails = allUsers
                .filter(u => adminIds.includes(u.id) && u.email)
                .map(u => u.email as string)

              if (adminEmails.length > 0) {
                await sendEmail({
                  to: adminEmails,
                  subject: 'New User Signup - DDPC',
                  html: `<p>A new user has signed up!</p><p><strong>Email:</strong> ${user.email}</p><p><strong>ID:</strong> ${user.id}</p>`
                })
                console.log('[Admin Notification] Sent new user notification to admins:', adminEmails.length)
              }
            }
          }
        }
      } catch (notifyError) {
        console.error('[Admin Notification] Failed to send new user notification:', notifyError)
        // Don't fail profile creation if notification fails
      }
    }

    return NextResponse.json({ success: true, message: 'Profile created' })
  } catch (error) {
    console.error('Unexpected error creating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
