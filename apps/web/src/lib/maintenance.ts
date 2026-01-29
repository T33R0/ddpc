import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Seeds the maintenance plan for a new user vehicle.
 * @param supabase The Supabase client instance.
 * @param userVehicleId The ID of the user's vehicle.
 * @param stockDataId The ID of the stock vehicle data to base the plan on.
 */
export async function seedMaintenancePlan(
  supabase: SupabaseClient,
  userVehicleId: string,
  stockDataId: string
) {
  try {
    // 1. Fetch the master service schedule for the given stock vehicle ID.
    const { data: masterSchedule, error: scheduleError } = await supabase
      .from('master_service_schedule')
      .select('*')
      .eq('vehicle_data_id', stockDataId);

    if (scheduleError) {
      console.error('Error fetching master service schedule:', scheduleError);
      throw new Error('Could not fetch master service schedule.');
    }

    if (!masterSchedule || masterSchedule.length === 0) {
      console.log(`No master service schedule found for vehicle_data_id: ${stockDataId}`);
      return; // No plan to seed, so we exit gracefully.
    }

    // 2. Prepare the new service interval records for the user's vehicle.
    const newIntervals = masterSchedule.map((item) => {
      const dueDate = new Date();
      if (item.interval_months) {
        dueDate.setMonth(dueDate.getMonth() + item.interval_months);
      }

      return {
        user_vehicle_id: userVehicleId,
        master_service_schedule_id: item.id,
        name: item.name,
        description: item.description,
        interval_miles: item.interval_miles,
        interval_months: item.interval_months,
        due_miles: item.interval_miles,
        due_date: item.interval_months ? dueDate.toISOString() : null,
      };
    });

    // 3. Insert the new intervals into the service_intervals table.
    const { error: insertError } = await supabase
      .from('service_intervals')
      .insert(newIntervals);

    if (insertError) {
      console.error('Error seeding service intervals:', insertError);
      throw new Error('Could not seed service intervals.');
    }

    console.log(`Successfully seeded maintenance plan for user_vehicle_id: ${userVehicleId}`);
  } catch (error) {
    console.error('An unexpected error occurred during maintenance plan seeding:', error);
    // Depending on the application's needs, you might want to handle this more gracefully.
    // For now, we log the error. The vehicle is already created, so this is a non-critical failure in that sense.
  }
}
