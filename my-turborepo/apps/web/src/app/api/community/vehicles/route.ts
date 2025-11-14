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
        spec_snapshot
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
    const summaries: VehicleSummary[] = (userVehicles || []).map((vehicle: any) => {
      // Extract data from spec_snapshot if available, otherwise use direct fields
      const specData = vehicle.spec_snapshot || {};

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
        odometer: vehicle.odometer,
        current_status: vehicle.current_status || 'parked',
        vehicle_image: vehicle.photo_url,
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
        warranty_basic: specData.warranty_basic || '',
        warranty_drivetrain: specData.warranty_drivetrain || '',
        warranty_roadside: specData.warranty_roadside || '',
        warranty_rust: specData.warranty_rust || '',
        source_json: specData.source_json || '',
        source_url: specData.source_url || '',
        // image_url: prefer spec_snapshot image, fallback to vehicle photo_url
        image_url: specData.image_url || vehicle.photo_url || '',
        review: specData.review || '',
        pros: specData.pros || '',
        cons: specData.cons || '',
        whats_new: specData.whats_new || '',
        nhtsa_overall_rating: specData.nhtsa_overall_rating || '',
        new_price_range: specData.new_price_range || '',
        used_price_range: specData.used_price_range || '',
        scorecard_overall: specData.scorecard_overall || '',
        scorecard_driving: specData.scorecard_driving || '',
        scorecard_confort: specData.scorecard_confort || '',
        scorecard_interior: specData.scorecard_interior || '',
        scorecard_utility: specData.scorecard_utility || '',
        scorecard_technology: specData.scorecard_technology || '',
        expert_verdict: specData.expert_verdict || '',
        expert_performance: specData.expert_performance || '',
        expert_comfort: specData.expert_comfort || '',
        expert_interior: specData.expert_interior || '',
        expert_technology: specData.expert_technology || '',
        expert_storage: specData.expert_storage || '',
        expert_fuel_economy: specData.expert_fuel_economy || '',
        expert_value: specData.expert_value || '',
        expert_wildcard: specData.expert_wildcard || '',
        old_trim: specData.old_trim || '',
        old_description: specData.old_description || '',
        images_url: specData.images_url || '',
        suspension: specData.suspension || '',
        front_seats: specData.front_seats || '',
        rear_seats: specData.rear_seats || '',
        power_features: specData.power_features || '',
        instrumentation: specData.instrumentation || '',
        convenience: specData.convenience || '',
        comfort: specData.comfort || '',
        memorized_settings: specData.memorized_settings || '',
        in_car_entertainment: specData.in_car_entertainment || '',
        roof_and_glass: specData.roof_and_glass || '',
        body: specData.body || '',
        truck_features: specData.truck_features || '',
        tires_and_wheels: specData.tires_and_wheels || '',
        doors_features: specData.doors_features || '',
        towing_and_hauling: specData.towing_and_hauling || '',
        safety_features: specData.safety_features || '',
        packages: specData.packages || '',
        exterior_options: specData.exterior_options || '',
        interior_options: specData.interior_options || '',
        mechanical_options: specData.mechanical_options || '',
        country_of_origin: specData.country_of_origin || '',
        car_classification: specData.car_classification || '',
        platform_code_generation: specData.platform_code_generation || '',
        date_added: vehicle.date_added || specData.date_added || '',
        new_make: specData.new_make || '',
        new_model: specData.new_model || '',
        new_year: specData.new_year || '',
        base_msrp: specData.base_msrp || '',
        base_invoice: specData.base_invoice || '',
        colors_interior: specData.colors_interior || '',
      };

      return {
        id: vehicle.id,
        year: vehicle.year?.toString() || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        // Prioritize user uploaded image, then stock photo
        heroImage: vehicle.photo_url || specData.image_url || undefined,
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
