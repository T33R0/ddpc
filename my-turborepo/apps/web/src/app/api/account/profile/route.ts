import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
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
    const { data: profile, error: profileError } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // Return the combined user data
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
    };

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
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
      isPublic
    } = body;

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
    const updateData: any = {
      username: username.trim(),
      display_name: displayName?.trim() || null,
      location: location?.trim() || null,
      website: website?.trim() || null,
      bio: bio?.trim() || null,
      avatar_url: avatarUrl?.trim() || null,
      is_public: isPublic ?? true,
      updated_at: new Date().toISOString(),
    };

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
    };

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
