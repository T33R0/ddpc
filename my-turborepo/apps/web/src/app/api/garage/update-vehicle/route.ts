// Enhanced debugging for update vehicle API
// Logs removed for security


import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface UpdateVehicleData {
  nickname?: string | null;
  current_status?: string;
  photo_url?: string | null;
  privacy?: 'PUBLIC' | 'PRIVATE';
  vehicle_image?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    // Check request headers
    const authHeader = request.headers.get('authorization');


    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid auth header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);


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
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();

    if (authError) {
      console.log('❌ Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized', details: authError.message }, { status: 401 });
    }

    if (!user) {
      console.log('❌ No user found');
      return NextResponse.json({ error: 'Unauthorized', details: 'No user found' }, { status: 401 });
    }



    // Parse request body
    let body;
    try {
      body = await request.json();

    } catch (error) {
      console.log('❌ Failed to parse request body:', error);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { vehicleId, nickname, status, photo_url, privacy, vehicle_image } = body;

    if (!vehicleId) {
      console.log('❌ Missing vehicleId');
      return NextResponse.json({ error: 'Missing required field: vehicleId' }, { status: 400 });
    }



    // First, verify the vehicle exists and belongs to the user
    const { data: vehicleCheck, error: vehicleCheckError } = await authenticatedSupabase
      .from('user_vehicle')
      .select('id, owner_id, current_status')
      .eq('id', vehicleId)
      .eq('owner_id', user.id)
      .single();

    if (vehicleCheckError || !vehicleCheck) {
      console.log('❌ Vehicle check error:', vehicleCheckError);
      return NextResponse.json({
        error: 'Vehicle not found or access denied',
        details: vehicleCheckError?.message || 'Vehicle not found'
      }, { status: 404 });
    }




    // Prepare update data
    const updateData: UpdateVehicleData = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (status !== undefined) updateData.current_status = status;
    if (photo_url !== undefined) updateData.photo_url = photo_url;
    if (privacy !== undefined) updateData.privacy = privacy;
    if (vehicle_image !== undefined) updateData.vehicle_image = vehicle_image;



    // Perform the update
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
      console.log('❌ Update data attempted:', updateData);
      
      // Check if it's an RLS policy error
      if (updateError.code === '42501' || 
          updateError.message?.includes('row-level security') || 
          updateError.message?.includes('RLS') ||
          updateError.message?.includes('permission denied') ||
          updateError.code === 'PGRST301') {
        return NextResponse.json({
          error: 'Permission denied. The RLS policy may be missing the WITH CHECK clause.',
          details: updateError.message,
          code: updateError.code,
          hint: 'Please run the fix_user_vehicle_update_rls.sql migration in your Supabase database. This adds the required WITH CHECK clause to the user_vehicle_update_self policy.'
        }, { status: 403 });
      }
      
      return NextResponse.json({
        error: 'Failed to update vehicle',
        details: updateError.message,
        code: updateError.code
      }, { status: 500 });
    }

    // CRITICAL: Verify the update actually happened
    // Without WITH CHECK clause, RLS can return success but not update the row
    if (!updatedVehicle) {
      console.log('❌ Update returned no data - RLS policy likely blocking update');
      return NextResponse.json({
        error: 'Update completed but no vehicle data returned',
        details: 'The update may have been silently blocked by RLS policies. Please verify the user_vehicle_update_self policy has both USING and WITH CHECK clauses.',
        hint: 'Run verify_rls_policy.sql to check, then fix_user_vehicle_update_rls.sql to fix.'
      }, { status: 500 });
    }

    // Verify the update actually changed the values
    const updateSucceeded = Object.keys(updateData).every(key => {
      const expectedValue = updateData[key as keyof UpdateVehicleData]
      const actualValue = updatedVehicle[key as keyof typeof updatedVehicle]
      return expectedValue === actualValue || 
             (expectedValue === null && actualValue === null) ||
             (expectedValue === undefined && actualValue === undefined)
    })

    if (!updateSucceeded) {
      console.log('❌ Update values do not match:', {
        attempted: updateData,
        returned: updatedVehicle
      })
      return NextResponse.json({
        error: 'Update may have been blocked - values do not match',
        details: 'The update returned but the values were not changed. This suggests RLS is blocking the update.',
        hint: 'Please run fix_user_vehicle_update_rls.sql to add the WITH CHECK clause to the RLS policy.'
      }, { status: 500 })
    }

    // Log successful update for debugging
    console.log('✅ Vehicle updated successfully:', {
      vehicleId: updatedVehicle.id,
      updatedFields: Object.keys(updateData),
      newStatus: updatedVehicle.current_status,
      newPrivacy: updatedVehicle.privacy
    });



    // Revalidate all pages that might display this vehicle's data
    revalidatePath('/garage')
    revalidatePath('/console')
    revalidatePath(`/vehicle/${vehicleId}`)

    // Also revalidate the nickname path if it exists
    if (updatedVehicle.nickname) {
      revalidatePath(`/vehicle/${updatedVehicle.nickname}`)
    }

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
