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
    // Constraint 1: Never Drive Backward (Standard Check)
    // The new_mileage_value must not be lower than the vehicle's highest recorded mileage
    const { data: maxMileageResult, error: maxMileageError } = await supabase
      .from('odometer_log')
      .select('reading_mi')
      .eq('user_vehicle_id', vehicleId)
      .order('reading_mi', { ascending: false })
      .limit(1)
      .single();

    if (maxMileageError && maxMileageError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching max mileage:', maxMileageError);
      return { success: false, error: 'Failed to validate mileage' };
    }

    const maxRecordedMileage = maxMileageResult?.reading_mi || 0;

    if (newMileageValue < maxRecordedMileage) {
      return {
        success: false,
        error: `Error: Mileage value ${newMileageValue} is less than the last recorded mileage of ${maxRecordedMileage}. Review the entry.`,
        code: 'MILEAGE_BACKWARD'
      };
    }

    // Constraint 2: No Chronological Mileage Leap (Historical Backlog Check)
    // Search for entries where recorded_at > new_event_date AND reading_mi < new_mileage_value
    // Since we're dealing with historical entries, we need to check for conflicts
    const { data: conflictingEntries, error: conflictError } = await supabase
      .from('odometer_log')
      .select('reading_mi, recorded_at')
      .eq('user_vehicle_id', vehicleId)
      .gt('reading_mi', newMileageValue) // Find entries with higher mileage than our new entry
      .order('recorded_at', { ascending: true });

    if (conflictError) {
      console.error('Error checking for conflicts:', conflictError);
      return { success: false, error: 'Failed to validate mileage constraints' };
    }

    // If there are any entries with higher mileage recorded before our event date,
    // we need to ensure chronological consistency
    if (conflictingEntries && conflictingEntries.length > 0) {
      // For historical entries, we need to check if any future entries have lower mileage
      const futureEntries = conflictingEntries.filter(entry =>
        new Date(entry.recorded_at) > new Date(newEventDate)
      );

      if (futureEntries.length > 0) {
        const earliestConflict = futureEntries[0];
        if (earliestConflict) {
          return {
            success: false,
            error: `Conflict: A subsequent log on ${earliestConflict.recorded_at} recorded a higher mileage of ${earliestConflict.reading_mi}. This historical entry is out of chronological mileage order.`,
            code: 'CHRONOLOGICAL_CONFLICT'
          };
        }
      }
    }

    // All constraints passed - insert the new odometer reading
    const { data: odometerEntry, error: insertError } = await supabase
      .from('odometer_log')
      .insert({
        user_vehicle_id: vehicleId,
        reading_mi: newMileageValue,
        recorded_at: new Date().toISOString(), // When this was logged in the system
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
