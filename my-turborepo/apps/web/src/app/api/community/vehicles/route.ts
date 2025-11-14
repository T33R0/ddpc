import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { VehicleSummary, TrimVariant } from '@repo/types';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10), 1);
    const pageSizeParam = parseInt(searchParams.get('pageSize') ?? '24', 10);
    const pageSize = Math.min(Math.max(pageSizeParam, 1), 100);
    const offset = (page - 1) * pageSize;

    // Get public user vehicles with all their data
    const { data: userVehicles, error } = await supabase
      .from('user_vehicle')
      .select(`
        id,
        nickname,
        year,
        make,
        model,
        trim,
        trim_description,
        odometer,
        current_status,
        photo_url,
        vehicle_image,
        privacy,
        body_type,
        doors,
        total_seating,
        length_in,
        width_in,
        height_in,
        wheelbase_in,
        front_track_in,
        rear_track_in,
        ground_clearance_in,
        angle_of_approach_deg,
        angle_of_departure_deg,
        turning_circle_ft,
        drag_coefficient_cd,
        epa_interior_volume_cuft,
        cargo_capacity_cuft,
        max_cargo_capacity_cuft,
        curb_weight_lbs,
        gross_weight_lbs,
        max_payload_lbs,
        max_towing_capacity_lbs,
        cylinders,
        engine_size_l,
        horsepower_hp,
        horsepower_rpm,
        torque_ft_lbs,
        torque_rpm,
        valves,
        valve_timing,
        cam_type,
        drive_type,
        transmission,
        engine_type,
        fuel_type,
        fuel_tank_capacity_gal,
        epa_combined_mpg,
        epa_city_highway_mpg,
        range_miles_city_hwy,
        epa_combined_mpge,
        epa_city_highway_mpge,
        epa_electric_range_mi,
        epa_kwh_per_100mi,
        epa_charge_time_240v_hr,
        battery_capacity_kwh,
        front_head_room_in,
        front_hip_room_in,
        front_leg_room_in,
        front_shoulder_room_in,
        rear_head_room_in,
        rear_hip_room_in,
        rear_leg_room_in,
        rear_shoulder_room_in,
        warranty_basic,
        warranty_drivetrain,
        warranty_roadside,
        warranty_rust,
        source_json,
        source_url,
        image_url,
        review,
        pros,
        cons,
        whats_new,
        nhtsa_overall_rating,
        new_price_range,
        used_price_range,
        scorecard_overall,
        scorecard_driving,
        scorecard_confort,
        scorecard_interior,
        scorecard_utility,
        scorecard_technology,
        expert_verdict,
        expert_performance,
        expert_comfort,
        expert_interior,
        expert_technology,
        expert_storage,
        expert_fuel_economy,
        expert_value,
        expert_wildcard,
        old_trim,
        old_description,
        images_url,
        suspension,
        front_seats,
        rear_seats,
        power_features,
        instrumentation,
        convenience,
        comfort,
        memorized_settings,
        in_car_entertainment,
        roof_and_glass,
        body,
        truck_features,
        tires_and_wheels,
        doors_features,
        towing_and_hauling,
        safety_features,
        packages,
        exterior_options,
        interior_options,
        mechanical_options,
        country_of_origin,
        car_classification,
        platform_code_generation,
        date_added,
        new_make,
        new_model,
        new_year,
        base_msrp,
        base_invoice,
        colors_exterior,
        colors_interior
      `)
      .eq('privacy', 'public')
      .order('date_added', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error fetching community vehicles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch community vehicles', details: error.message },
        { status: 500 }
      );
    }

    // Transform user vehicles into VehicleSummary format for compatibility with existing gallery
    const summaries: VehicleSummary[] = (userVehicles || []).map((vehicle: any) => {
      // Create a single trim for each user vehicle
      const trim: TrimVariant = {
        ...vehicle,
        primaryImage: vehicle.photo_url || vehicle.vehicle_image || undefined,
        // Override id to be unique (using user_vehicle id)
        id: vehicle.id,
      };

      return {
        id: vehicle.id,
        year: vehicle.year || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        heroImage: vehicle.photo_url || vehicle.vehicle_image || undefined,
        trims: [trim],
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
