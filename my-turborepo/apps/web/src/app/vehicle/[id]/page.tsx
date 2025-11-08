import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { VehicleDetailPageClient } from '@/features/vehicle/VehicleDetailPageClient'
import { Vehicle } from '@repo/types'

type VehiclePageProps = {
  params: Promise<{
    id: string // This is the vehicle ID (or slug)
  }>
}

//
// This is now an async Server Component
//
export default async function VehicleDetailPage({ params }: VehiclePageProps) {
  const supabase = await createClient()
  const resolvedParams = await params
  const vehicleSlug = decodeURIComponent(resolvedParams.id)

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/auth/signin?message=You must be logged in to view a vehicle.')
  }

  // --- 1. Fetch Vehicle Data (with Ownership Check) ---
  // This is the critical pattern from your audit (log-service route)
  // We fetch the vehicle AND check ownership in one query.

  console.log('VehicleDetailPage: Looking for vehicle with slug:', vehicleSlug, 'for user:', user.id)

  // First, try to find the vehicle by nickname
  let { data: vehicle, error: vehicleError } = await supabase
    .from('user_vehicle')
    .select(`
      *,
      vehicle_data ( * )
    `)
    .eq('owner_id', user.id)
    .eq('nickname', vehicleSlug)
    .single()

  console.log('VehicleDetailPage: Nickname search result:', { vehicle: !!vehicle, error: vehicleError })

  // If not found by nickname, try by ID
  if (!vehicle && !vehicleError) {
    console.log('VehicleDetailPage: Trying ID search for:', vehicleSlug)
    const { data: vehicleById, error: idError } = await supabase
      .from('user_vehicle')
      .select(`
        *,
        vehicle_data ( * )
      `)
      .eq('owner_id', user.id)
      .eq('id', vehicleSlug)
      .single()

    vehicle = vehicleById
    vehicleError = idError
    console.log('VehicleDetailPage: ID search result:', { vehicle: !!vehicle, error: vehicleError })
  }

  if (vehicleError || !vehicle) {
    console.error('VehicleDetailPage: Error fetching vehicle or vehicle not found:', {
      vehicleSlug,
      userId: user.id,
      vehicleError,
      hasVehicle: !!vehicle
    })
    notFound() // Triggers 404 page
  }

  console.log('VehicleDetailPage: Found vehicle:', vehicle.id, vehicle.nickname, vehicle.current_status)

  // --- 2. Fetch Latest Odometer Reading ---
  const { data: latestOdometer } = await supabase
    .from('odometer_log')
    .select('reading_mi')
    .eq('user_vehicle_id', vehicle.id)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single()

  // --- 3. Transform Data ---
  const vehicleWithData: Vehicle = {
    id: vehicle.id,
    name: vehicle.nickname || vehicle.title || vehicleSlug || `${vehicle.vehicle_data?.year || vehicle.year || ''} ${vehicle.vehicle_data?.make || vehicle.make || ''} ${vehicle.vehicle_data?.model || vehicle.model || ''} ${vehicle.vehicle_data?.trim || vehicle.trim || ''}`.trim() || 'Unnamed Vehicle',
    make: vehicle.vehicle_data?.make || vehicle.make || '',
    model: vehicle.vehicle_data?.model || vehicle.model || '',
    year: vehicle.vehicle_data?.year || vehicle.year || '',
    trim: vehicle.vehicle_data?.trim || vehicle.trim || '',
    trim_description: vehicle.vehicle_data?.trim_description,
    base_msrp: vehicle.vehicle_data?.base_msrp,
    base_invoice: vehicle.vehicle_data?.base_invoice,
    colors_exterior: vehicle.vehicle_data?.colors_exterior,
    colors_interior: vehicle.vehicle_data?.colors_interior,
    body_type: vehicle.vehicle_data?.body_type || vehicle.body_type,
    doors: vehicle.vehicle_data?.doors,
    total_seating: vehicle.vehicle_data?.total_seating,
    length_in: vehicle.vehicle_data?.length_in || vehicle.length_in,
    width_in: vehicle.vehicle_data?.width_in || vehicle.width_in,
    height_in: vehicle.vehicle_data?.height_in || vehicle.height_in,
    wheelbase_in: vehicle.vehicle_data?.wheelbase_in,
    front_track_in: vehicle.vehicle_data?.front_track_in,
    rear_track_in: vehicle.vehicle_data?.rear_track_in,
    ground_clearance_in: vehicle.vehicle_data?.ground_clearance_in,
    angle_of_approach_deg: vehicle.vehicle_data?.angle_of_approach_deg,
    angle_of_departure_deg: vehicle.vehicle_data?.angle_of_departure_deg,
    turning_circle_ft: vehicle.vehicle_data?.turning_circle_ft,
    drag_coefficient_cd: vehicle.vehicle_data?.drag_coefficient_cd,
    epa_interior_volume_cuft: vehicle.vehicle_data?.epa_interior_volume_cuft,
    cargo_capacity_cuft: vehicle.vehicle_data?.cargo_capacity_cuft,
    max_cargo_capacity_cuft: vehicle.vehicle_data?.max_cargo_capacity_cuft,
    curb_weight_lbs: vehicle.vehicle_data?.curb_weight_lbs,
    gross_weight_lbs: vehicle.vehicle_data?.gross_weight_lbs,
    max_payload_lbs: vehicle.vehicle_data?.max_payload_lbs,
    max_towing_capacity_lbs: vehicle.vehicle_data?.max_towing_capacity_lbs,
    cylinders: vehicle.vehicle_data?.cylinders || vehicle.cylinders,
    engine_size_l: vehicle.vehicle_data?.engine_size_l || vehicle.engine_size_l,
    horsepower_hp: vehicle.vehicle_data?.horsepower_hp || vehicle.horsepower_hp,
    horsepower_rpm: vehicle.vehicle_data?.horsepower_rpm,
    torque_ft_lbs: vehicle.vehicle_data?.torque_ft_lbs || vehicle.torque_ft_lbs,
    torque_rpm: vehicle.vehicle_data?.torque_rpm,
    valves: vehicle.vehicle_data?.valves,
    valve_timing: vehicle.vehicle_data?.valve_timing,
    cam_type: vehicle.vehicle_data?.cam_type,
    drive_type: vehicle.vehicle_data?.drive_type || vehicle.drive_type,
    transmission: vehicle.vehicle_data?.transmission || vehicle.transmission,
    engine_type: vehicle.vehicle_data?.engine_type,
    fuel_type: vehicle.vehicle_data?.fuel_type || vehicle.fuel_type,
    fuel_tank_capacity_gal: vehicle.vehicle_data?.fuel_tank_capacity_gal,
    epa_combined_mpg: vehicle.vehicle_data?.epa_combined_mpg || vehicle.epa_combined_mpg,
    epa_city_highway_mpg: vehicle.vehicle_data?.epa_city_highway_mpg,
    range_miles_city_hwy: vehicle.vehicle_data?.range_miles_city_hwy,
    epa_combined_mpge: vehicle.vehicle_data?.epa_combined_mpge,
    epa_city_highway_mpge: vehicle.vehicle_data?.epa_city_highway_mpge,
    epa_electric_range_mi: vehicle.vehicle_data?.epa_electric_range_mi,
    epa_kwh_per_100mi: vehicle.vehicle_data?.epa_kwh_per_100mi,
    epa_charge_time_240v_hr: vehicle.vehicle_data?.epa_charge_time_240v_hr,
    battery_capacity_kwh: vehicle.vehicle_data?.battery_capacity_kwh,
    front_head_room_in: vehicle.vehicle_data?.front_head_room_in,
    front_hip_room_in: vehicle.vehicle_data?.front_hip_room_in,
    front_leg_room_in: vehicle.vehicle_data?.front_leg_room_in,
    front_shoulder_room_in: vehicle.vehicle_data?.front_shoulder_room_in,
    rear_head_room_in: vehicle.vehicle_data?.rear_head_room_in,
    rear_hip_room_in: vehicle.vehicle_data?.rear_hip_room_in,
    rear_leg_room_in: vehicle.vehicle_data?.rear_leg_room_in,
    rear_shoulder_room_in: vehicle.vehicle_data?.rear_shoulder_room_in,
    warranty_basic: vehicle.vehicle_data?.warranty_basic,
    warranty_drivetrain: vehicle.vehicle_data?.warranty_drivetrain,
    warranty_roadside: vehicle.vehicle_data?.warranty_roadside,
    warranty_rust: vehicle.vehicle_data?.warranty_rust,
    source_json: vehicle.vehicle_data?.source_json,
    source_url: vehicle.vehicle_data?.source_url,
    image_url: vehicle.photo_url || vehicle.vehicle_data?.image_url,
    review: vehicle.vehicle_data?.review,
    pros: vehicle.vehicle_data?.pros,
    cons: vehicle.vehicle_data?.cons,
    whats_new: vehicle.vehicle_data?.whats_new,
    nhtsa_overall_rating: vehicle.vehicle_data?.nhtsa_overall_rating,
    new_price_range: vehicle.vehicle_data?.new_price_range,
    used_price_range: vehicle.vehicle_data?.used_price_range,
    scorecard_overall: vehicle.vehicle_data?.scorecard_overall,
    scorecard_driving: vehicle.vehicle_data?.scorecard_driving,
    scorecard_confort: vehicle.vehicle_data?.scorecard_confort,
    scorecard_interior: vehicle.vehicle_data?.scorecard_interior,
    scorecard_utility: vehicle.vehicle_data?.scorecard_utility,
    scorecard_technology: vehicle.vehicle_data?.scorecard_technology,
    expert_verdict: vehicle.vehicle_data?.expert_verdict,
    expert_performance: vehicle.vehicle_data?.expert_performance,
    expert_comfort: vehicle.vehicle_data?.expert_comfort,
    expert_interior: vehicle.vehicle_data?.expert_interior,
    expert_technology: vehicle.vehicle_data?.expert_technology,
    expert_storage: vehicle.vehicle_data?.expert_storage,
    expert_fuel_economy: vehicle.vehicle_data?.expert_fuel_economy,
    expert_value: vehicle.vehicle_data?.expert_value,
    expert_wildcard: vehicle.vehicle_data?.expert_wildcard,
    old_trim: vehicle.vehicle_data?.old_trim,
    old_description: vehicle.vehicle_data?.old_description,
    images_url: vehicle.vehicle_data?.images_url,
    suspension: vehicle.vehicle_data?.suspension,
    front_seats: vehicle.vehicle_data?.front_seats,
    rear_seats: vehicle.vehicle_data?.rear_seats,
    power_features: vehicle.vehicle_data?.power_features,
    instrumentation: vehicle.vehicle_data?.instrumentation,
    convenience: vehicle.vehicle_data?.convenience,
    comfort: vehicle.vehicle_data?.comfort,
    memorized_settings: vehicle.vehicle_data?.memorized_settings,
    in_car_entertainment: vehicle.vehicle_data?.in_car_entertainment,
    roof_and_glass: vehicle.vehicle_data?.roof_and_glass,
    body: vehicle.vehicle_data?.body,
    truck_features: vehicle.vehicle_data?.truck_features,
    tires_and_wheels: vehicle.vehicle_data?.tires_and_wheels,
    doors_features: vehicle.vehicle_data?.doors_features,
    towing_and_hauling: vehicle.vehicle_data?.towing_and_hauling,
    safety_features: vehicle.vehicle_data?.safety_features,
    packages: vehicle.vehicle_data?.packages,
    exterior_options: vehicle.vehicle_data?.exterior_options,
    interior_options: vehicle.vehicle_data?.interior_options,
    mechanical_options: vehicle.vehicle_data?.mechanical_options,
    country_of_origin: vehicle.vehicle_data?.country_of_origin,
    car_classification: vehicle.vehicle_data?.car_classification,
    platform_code_generation: vehicle.vehicle_data?.platform_code_generation,
    date_added: vehicle.vehicle_data?.date_added,
    new_make: vehicle.vehicle_data?.new_make,
    new_model: vehicle.vehicle_data?.new_model,
    new_year: vehicle.vehicle_data?.new_year,
  }

  // Add the user-specific fields that aren't in vehicle_data
  vehicleWithData.odometer = latestOdometer?.reading_mi || vehicle.odometer || null
  vehicleWithData.current_status = vehicle.current_status || 'parked'

  // --- 4. Pass Data to Client Component ---
  return (
    <VehicleDetailPageClient
      vehicle={vehicleWithData}
    />
  )
}