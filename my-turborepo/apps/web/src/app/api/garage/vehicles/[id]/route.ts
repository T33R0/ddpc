import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: vehicleId } = await params

    // Fetch the specific user vehicle with full vehicle details
    const { data: userVehicle, error: vehicleError } = await supabase
      .from('user_vehicle')
      .select(`
        id,
        nickname,
        year,
        make,
        model,
        trim,
        odometer,
        title,
        current_status,
        vehicle_id,
        vehicles (
          id,
          make,
          model,
          year,
          trim,
          trim_description,
          base_msrp,
          base_invoice,
          colors_exterior,
          colors_interior,
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
          new_year
        )
      `)
      .eq('id', vehicleId)
      .eq('owner_id', user.id)
      .single()

    if (vehicleError) {
      console.error('Error fetching vehicle:', vehicleError)
      if (vehicleError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
      }
      return NextResponse.json(
        { error: 'Failed to fetch vehicle', details: vehicleError.message },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const vehicleData = userVehicle.vehicles
    const transformedVehicle = {
      id: userVehicle.id,
      name: userVehicle.nickname || userVehicle.title || `${userVehicle.year || ''} ${userVehicle.make || ''} ${userVehicle.model || ''} ${userVehicle.trim || ''}`.trim() || 'Unnamed Vehicle',
      ymmt: `${userVehicle.year || ''} ${userVehicle.make || ''} ${userVehicle.model || ''} ${userVehicle.trim || ''}`.trim(),
      odometer: userVehicle.odometer,
      current_status: userVehicle.current_status || 'parked',
      // Include all vehicle specification fields
      ...vehicleData
    }

    return NextResponse.json({
      vehicle: transformedVehicle
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
