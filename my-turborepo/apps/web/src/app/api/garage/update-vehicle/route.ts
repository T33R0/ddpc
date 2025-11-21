// Enhanced debugging for update vehicle API
console.log('=== UPDATE VEHICLE API DEBUG ===');
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_ANON_KEY loaded:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log('SUPABASE_SERVICE_KEY loaded:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log('=== UPDATE VEHICLE API CALLED ===');

    // Check request headers
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    console.log('Auth header starts with Bearer:', authHeader?.startsWith('Bearer '));

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid auth header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 20) + '...');

    // Create Supabase client
    const authenticatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // Test user authentication
    console.log('🔍 Attempting to get user...');
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();

    if (authError) {
      console.log('❌ Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized', details: authError.message }, { status: 401 });
    }

    if (!user) {
      console.log('❌ No user found');
      return NextResponse.json({ error: 'Unauthorized', details: 'No user found' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id, user.email);

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('📦 Request body:', body);
    } catch (error) {
      console.log('❌ Failed to parse request body:', error);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { vehicleId, nickname, status, photo_url, privacy, vehicle_image } = body;

    if (!vehicleId) {
      console.log('❌ Missing vehicleId');
      return NextResponse.json({ error: 'Missing required field: vehicleId' }, { status: 400 });
    }

    console.log('🔍 Vehicle ID to update:', vehicleId);
    console.log('📝 Update data:', { nickname, status });

    // First, verify the vehicle exists and belongs to the user
    console.log('🔍 Checking if vehicle exists and belongs to user...');
    const { data: vehicleCheck, error: vehicleCheckError } = await authenticatedSupabase
      .from('user_vehicle')
      .select('id, owner_id, current_status')
      .eq('id', vehicleId)
      .eq('owner_id', user.id)
      .single();

    if (vehicleCheckError) {
      console.log('❌ Vehicle check error:', vehicleCheckError);
      return NextResponse.json({
        error: 'Vehicle not found or access denied',
        details: vehicleCheckError.message
      }, { status: 404 });
    }

    if (!vehicleCheck) {
      console.log('❌ Vehicle not found');
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    console.log('✅ Vehicle found:', vehicleCheck);

    // Prepare update data
    const updateData: any = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (status !== undefined) updateData.current_status = status;
    if (photo_url !== undefined) updateData.photo_url = photo_url;
    if (privacy !== undefined) updateData.privacy = privacy;
    if (vehicle_image !== undefined) updateData.vehicle_image = vehicle_image;

    console.log('📝 Update data prepared:', updateData);

    // Perform the update
    console.log('🔄 Attempting database update...');
    const { data: updatedVehicle, error: updateError } = await authenticatedSupabase
      .from('user_vehicle')
      .update(updateData)
      .eq('id', vehicleId)
      .eq('owner_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Database update error:', updateError);
      console.log('❌ Error code:', updateError.code);
      console.log('❌ Error details:', updateError.details);
      console.log('❌ Error hint:', updateError.hint);
      return NextResponse.json({
        error: 'Failed to update vehicle',
        details: updateError.message,
        code: updateError.code
      }, { status: 500 });
    }

    console.log('✅ Vehicle updated successfully:', updatedVehicle);

    // Revalidate all pages that might display this vehicle's data
    revalidatePath('/garage')
    revalidatePath('/console')
    revalidatePath(`/vehicle/${vehicleId}`)

    return NextResponse.json({
      success: true,
      vehicle: updatedVehicle,
      message: 'Vehicle updated successfully'
    });

  } catch (error) {
    console.error('❌ Unexpected error in update vehicle API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
