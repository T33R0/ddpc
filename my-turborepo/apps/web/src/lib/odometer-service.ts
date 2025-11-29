import { SupabaseClient } from '@supabase/supabase-js';

export interface OdometerValidationResult {
  success: boolean;
  error?: string;
  code?: string;
  odometerEntryId?: string;
}

export interface CurrentMileageResult {
  currentMileage: number | null;
  lastReadingDate: string | null;
}

export async function validateAndRecordOdometerReading(
  supabase: SupabaseClient,
  vehicleId: string,
  newMileageValue: number,
  newEventDate: string
): Promise<OdometerValidationResult> {
  try {
    // RELAXED VALIDATION: We now accept any odometer reading.
    // We simply record it. If it's out of order, it will just appear that way in the history.

    // Insert the new odometer reading
    const { data: odometerEntry, error: insertError } = await supabase
      .from('odometer_log')
      .insert({
        user_vehicle_id: vehicleId,
        reading_mi: newMileageValue,
        recorded_at: newEventDate, // Use the actual event date, not system time
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error inserting odometer reading:', insertError);
      return { success: false, error: 'Failed to record odometer reading' };
    }

    return {
      success: true,
      odometerEntryId: odometerEntry.id
    };

  } catch (error) {
    console.error('Error in odometer validation service:', error);
    return { success: false, error: 'Internal server error during odometer validation' };
  }
}

export async function getCurrentMileage(
  supabase: SupabaseClient,
  vehicleId: string
): Promise<CurrentMileageResult> {
  try {
    // Get the most recent odometer reading (highest mileage from most recent date)
    const { data: latestReading, error } = await supabase
      .from('odometer_log')
      .select('reading_mi, recorded_at')
      .eq('user_vehicle_id', vehicleId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return { currentMileage: null, lastReadingDate: null };
      }
      console.error('Error fetching current mileage:', error);
      throw error;
    }

    return {
      currentMileage: latestReading.reading_mi,
      lastReadingDate: latestReading.recorded_at
    };

  } catch (error) {
    console.error('Error in getCurrentMileage:', error);
    throw error;
  }
}
