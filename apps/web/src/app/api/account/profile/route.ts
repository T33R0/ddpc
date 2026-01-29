import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { toUsernameSlug } from '@/lib/user-routing';

export async function GET(request: NextRequest) {
  try {
    // Check if we're in a build environment and handle gracefully
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the user profile
    const { data: initialProfile, error: profileError } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let profile = initialProfile;

    // If profile doesn't exist, create a default one
    if (profileError && profileError.code === 'PGRST116') {
      console.log('User profile not found, creating default profile for user:', user.id);

      // Generate a unique username by appending a random number if needed
      const baseUsername = user.email?.split('@')[0] || 'user';
      let username = baseUsername;
      let counter = 1;

      // Keep trying until we find a unique username
      while (true) {
        const { data: existing } = await supabase
          .from('user_profile')
          .select('user_id')
          .eq('username', username)
          .single();

        if (!existing) break;

        username = `${baseUsername}${counter}`;
        counter++;

        // Prevent infinite loops
        if (counter > 100) {
          username = `user_${user.id.slice(0, 8)}`;
          break;
        }
      }

      const defaultProfile = {
        user_id: user.id,
        username: username,
        display_name: user.email?.split('@')[0] || 'User',
        is_public: true,
        role: 'user',
        plan: 'free',
        banned: false,
        notify_on_new_user: false,
        notify_on_issue_report: false,
      };

      const { data: newProfile, error: createError } = await supabase
        .from('user_profile')
        .insert(defaultProfile)
        .select('*')
        .single();

      if (createError) {
        console.error('Error creating default profile:', createError);
        console.error('Profile data being inserted:', defaultProfile);
        return NextResponse.json({
          error: 'Failed to create profile',
          details: createError.message,
          code: createError.code
        }, { status: 500 });
      }

      profile = newProfile;
    } else if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // Return the combined user data (email comes from auth.users)
    const userData = {
      id: user.id,
      email: user.email,
      username: profile.username,
      displayName: profile.display_name,
      location: profile.location,
      website: profile.website,
      bio: profile.bio,
      avatarUrl: profile.avatar_url,
      isPublic: profile.is_public,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
      role: profile.role,
      plan: profile.plan,
      banned: profile.banned,
      notifyOnNewUser: profile.notify_on_new_user,
      notifyOnIssueReport: profile.notify_on_issue_report,
    };

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if we're in a build environment and handle gracefully
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the request body
    const body = await request.json();
    const {
      username,
      displayName,
      location,
      website,
      bio,
      avatarUrl,
      isPublic,
      notifyOnNewUser,
      notifyOnIssueReport
    } = body;

    // Note: email is not stored in user_profile table, it comes from auth.users

    // Validate required fields
    if (!username || username.trim() === '') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Check if username is already taken by another user
    const { data: existingUser, error: checkError } = await supabase
      .from('user_profile')
      .select('user_id')
      .eq('username', username.trim())
      .neq('user_id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking username:', checkError);
      return NextResponse.json({ error: 'Failed to validate username' }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
    }

    // Update the user profile
    const updateData: Record<string, unknown> = {
      username: username.trim(),
      display_name: displayName?.trim() || null,
      location: location?.trim() || null,
      website: website?.trim() || null,
      bio: bio?.trim() || null,
      avatar_url: avatarUrl?.trim() || null,
      is_public: isPublic ?? true,
      updated_at: new Date().toISOString(),
    };

    // Only allow updating notification settings if user is admin
    // We check the role from the token or re-fetch it.
    // Since 'user' object is from auth.getUser(), it might not have the role from user_profile.
    // However, the role is typically stored in user_profile.
    // We can fetch the current profile to check the role before updating if we want to be strict.
    // Or, we can trust the UI state for now but enforcing at DB level is better.
    // For now, let's just pass them if they are present.
    // The requirement says "admins should have the new user and new error toggle options; all other users will currently have nothing".
    // I will add them to the update payload. If we want to strictly enforce admin-only write, we would check the role here.
    // Given the context, I will include them in the update.

    // Fetch current role to verify if user is allowed to toggle notifications
    const { data: currentRoleData } = await supabase
        .from('user_profile')
        .select('role')
        .eq('user_id', user.id)
        .single();

    if (currentRoleData?.role === 'admin') {
        if (notifyOnNewUser !== undefined) updateData.notify_on_new_user = notifyOnNewUser;
        if (notifyOnIssueReport !== undefined) updateData.notify_on_issue_report = notifyOnIssueReport;
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profile')
      .update(updateData)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    const sanitizedUsername = username.trim();
    const usernameSlug = toUsernameSlug(sanitizedUsername) ?? sanitizedUsername.toLowerCase();

    const { error: metadataSyncError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        username: usernameSlug,
        preferred_username: sanitizedUsername,
        display_name: displayName?.trim() || null,
        avatar_url: avatarUrl?.trim() || null,
      },
    });

    if (metadataSyncError) {
      console.error('Error syncing auth metadata:', metadataSyncError);
    }

    // Return the updated user data
    const userData = {
      id: user.id,
      email: user.email,
      username: updatedProfile.username,
      displayName: updatedProfile.display_name,
      location: updatedProfile.location,
      website: updatedProfile.website,
      bio: updatedProfile.bio,
      avatarUrl: updatedProfile.avatar_url,
      isPublic: updatedProfile.is_public,
      createdAt: updatedProfile.created_at,
      updatedAt: updatedProfile.updated_at,
      role: updatedProfile.role,
      plan: updatedProfile.plan,
      banned: updatedProfile.banned,
      notifyOnNewUser: updatedProfile.notify_on_new_user,
      notifyOnIssueReport: updatedProfile.notify_on_issue_report,
    };

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
