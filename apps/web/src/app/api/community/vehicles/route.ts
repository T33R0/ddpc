import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { VehicleSummary, TrimVariant } from '@repo/types';
import { parsePrivacySettings } from '@/lib/vehicle-privacy-filter';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables are not configured.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

interface CommunityVehicle {
  id: string;
  nickname: string | null;
  title: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  odometer: number | null;
  current_status: string | null;
  vehicle_image: string | null;
  photo_url: string | null;
  privacy: 'PUBLIC' | 'PRIVATE';
  spec_snapshot: Record<string, unknown> | null;
  user_profile: { display_name: string | null } | { display_name: string | null }[] | null;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10), 1);
    const pageSizeParam = parseInt(searchParams.get('pageSize') ?? '24', 10);
    const pageSize = Math.min(Math.max(pageSizeParam, 1), 100);
    const offset = (page - 1) * pageSize;

    // Get public user vehicles with their data
    // Note: privacy field uses uppercase 'PUBLIC'/'PRIVATE' per database schema
    const { data: userVehicles, error } = await supabase
      .from('user_vehicle')
      .select(`
        id,
        nickname,
        year,
        make,
        model,
        trim,
        title,
        odometer,
        current_status,
        vehicle_image,
        photo_url,
        privacy,
        body_type,
        cylinders,
        engine_size_l,
        horsepower_hp,
        torque_ft_lbs,
        fuel_type,
        drive_type,
        transmission,
        length_in,
        width_in,
        height_in,
        epa_combined_mpg,
        colors_exterior,
        spec_snapshot,
        privacy_settings,
        user_profile (
            display_name
        )
      `)
      .eq('privacy', 'PUBLIC')
      .order('id', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error fetching community vehicles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch community vehicles', details: error.message },
        { status: 500 }
      );
    }

    // Debug logging (remove in production if needed)
    console.log(`Found ${userVehicles?.length || 0} public vehicles`);

    // Transform user vehicles into VehicleSummary format for compatibility with existing gallery
    const summaries: VehicleSummary[] = (userVehicles || []).map((vehicle: CommunityVehicle) => {
      // Apply privacy filtering — respect per-vehicle field-level settings
      const privacy = parsePrivacySettings(vehicle.privacy_settings)

      // Extract data from spec_snapshot if available, otherwise use direct fields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const specData = (vehicle.spec_snapshot || {}) as Record<string, any>;

      // Resolve display name safely
      const displayName = Array.isArray(vehicle.user_profile)
        ? vehicle.user_profile[0]?.display_name
        : vehicle.user_profile?.display_name;

      // Create a single trim for each user vehicle with all available data
      const trim: TrimVariant = {
        // Basic vehicle data
        id: vehicle.id,
        name: vehicle.nickname || vehicle.title || `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.trim || ''}`.trim() || 'Unnamed Vehicle',

        // Direct fields from user_vehicle
        year: vehicle.year?.toString() || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        trim: vehicle.trim || '',
        trim_description: vehicle.title || specData.trim_description || '',
        odometer: privacy.show_odometer ? vehicle.odometer : null,
        current_status: vehicle.current_status || 'inactive',
        vehicle_image: vehicle.vehicle_image || vehicle.photo_url || null, // Prioritize vehicle_image (user uploaded) over photo_url
        privacy: vehicle.privacy,
        body_type: vehicle.body_type || specData.body_type || '',
        cylinders: vehicle.cylinders || specData.cylinders || '',
        engine_size_l: vehicle.engine_size_l?.toString() || specData.engine_size_l || '',
        horsepower_hp: vehicle.horsepower_hp?.toString() || specData.horsepower_hp || '',
        horsepower_rpm: specData.horsepower_rpm || '',
        torque_ft_lbs: vehicle.torque_ft_lbs?.toString() || specData.torque_ft_lbs || '',
        torque_rpm: specData.torque_rpm || '',
        fuel_type: vehicle.fuel_type || specData.fuel_type || '',
        drive_type: vehicle.drive_type || specData.drive_type || '',
        transmission: vehicle.transmission || specData.transmission || '',
        length_in: vehicle.length_in?.toString() || specData.length_in || '',
        width_in: vehicle.width_in?.toString() || specData.width_in || '',
        height_in: vehicle.height_in?.toString() || specData.height_in || '',
        epa_combined_mpg: vehicle.epa_combined_mpg?.toString() || specData.epa_combined_mpg || '',
        colors_exterior: vehicle.colors_exterior || specData.colors_exterior || '',

        // Fields from spec_snapshot
        doors: specData.doors || '',
        total_seating: specData.total_seating || '',
        wheelbase_in: specData.wheelbase_in || '',
        front_track_in: specData.front_track_in || '',
        rear_track_in: specData.rear_track_in || '',
        ground_clearance_in: specData.ground_clearance_in || '',
        angle_of_approach_deg: specData.angle_of_approach_deg || '',
        angle_of_departure_deg: specData.angle_of_departure_deg || '',
        turning_circle_ft: specData.turning_circle_ft || '',
        drag_coefficient_cd: specData.drag_coefficient_cd || '',
        epa_interior_volume_cuft: specData.epa_interior_volume_cuft || '',
        cargo_capacity_cuft: specData.cargo_capacity_cuft || '',
        max_cargo_capacity_cuft: specData.max_cargo_capacity_cuft || '',
        curb_weight_lbs: specData.curb_weight_lbs || '',
        gross_weight_lbs: specData.gross_weight_lbs || '',
        max_payload_lbs: specData.max_payload_lbs || '',
        max_towing_capacity_lbs: specData.max_towing_capacity_lbs || '',
        valves: specData.valves || '',
        valve_timing: specData.valve_timing || '',
        cam_type: specData.cam_type || '',
        engine_type: specData.engine_type || '',
        fuel_tank_capacity_gal: specData.fuel_tank_capacity_gal || '',
        epa_city_highway_mpg: specData.epa_city_highway_mpg || '',
        range_miles_city_hwy: specData.range_miles_city_hwy || '',
        epa_combined_mpge: specData.epa_combined_mpge || '',
        epa_city_highway_mpge: specData.epa_city_highway_mpge || '',
        epa_electric_range_mi: specData.epa_electric_range_mi || '',
        epa_kwh_per_100mi: specData.epa_kwh_per_100mi || '',
        epa_charge_time_240v_hr: specData.epa_charge_time_240v_hr || '',
        battery_capacity_kwh: specData.battery_capacity_kwh || '',
        front_head_room_in: specData.front_head_room_in || '',
        front_hip_room_in: specData.front_hip_room_in || '',
        front_leg_room_in: specData.front_leg_room_in || '',
        front_shoulder_room_in: specData.front_shoulder_room_in || '',
        rear_head_room_in: specData.rear_head_room_in || '',
        rear_hip_room_in: specData.rear_hip_room_in || '',
        rear_leg_room_in: specData.rear_leg_room_in || '',
        rear_shoulder_room_in: specData.rear_shoulder_room_in || '',
      };

      return {
        id: vehicle.id, // Use actual ID
        year: vehicle.year?.toString() || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        // Prioritize user uploaded vehicle_image, then photo_url, then stock photo
        heroImage: vehicle.vehicle_image || vehicle.photo_url || specData.image_url || undefined,
        trims: [trim],
        nickname: vehicle.nickname || undefined,
        ownerDisplayName: displayName || undefined,
      };
    });

    return NextResponse.json({
      data: summaries,
      page,
      pageSize,
    });
  } catch (err) {
    console.error('Unexpected error in community vehicles API:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';

    return NextResponse.json(
      { error: `Failed to fetch community vehicles: ${errorMessage}` },
      { status: 500 }
    );
  }
}
