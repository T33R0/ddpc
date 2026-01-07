'use server';

import { createClient } from '@/lib/supabase/server';
import { PartsDataResponse, PartSlot, ComponentDefinition, VehicleInstalledComponent, MasterPart } from './types';

export async function getPartsData(vehicleId: string): Promise<PartsDataResponse | { error: string }> {
  const supabase = await createClient();

  try {
    // 1. Fetch Vehicle Data (Odometer)
    const { data: vehicleData, error: vehicleError } = await supabase
      .from('user_vehicle')
      .select('id, odometer')
      .eq('id', vehicleId)
      .single();

    if (vehicleError || !vehicleData) {
      console.error('Error fetching vehicle:', vehicleError);
      return { error: 'Vehicle not found' };
    }

    // 2. Fetch All Component Definitions (Slots)
    const { data: definitionsData, error: definitionsError } = await supabase
      .from('component_definitions')
      .select('*');

    if (definitionsError) {
      console.error('Error fetching definitions:', definitionsError);
      return { error: 'Failed to fetch component definitions' };
    }

    const definitions = definitionsData as ComponentDefinition[];

    // 3. Fetch Installed Components for this Vehicle
    // We also join master_parts_list to get part details
    const { data: installedData, error: installedError } = await supabase
      .from('vehicle_installed_components')
      .select(`
        *,
        master_part:master_parts_list (
          id,
          name,
          part_number,
          vendor_link
        )
      `)
      .eq('user_vehicle_id', vehicleId);

    if (installedError) {
      console.error('Error fetching installed components:', installedError);
      return { error: 'Failed to fetch installed components' };
    }

    // Cast the joined data correctly
    // Supabase returns nested objects for joins, type assertion needed usually
    const installedComponents = installedData as unknown as (VehicleInstalledComponent & { master_part: MasterPart })[];

    // 4. Combine Definitions with Installed Data
    const slots: PartSlot[] = definitions.map((def) => {
      const installed = installedComponents.find(
        (ic) => ic.component_definition_id === def.id
      );

      // Transform the data to match our clean types if necessary
      // Here we just attach the found installed component
      return {
        ...def,
        installedComponent: installed ? {
            ...installed,
            master_part: installed.master_part // Ensure this is carried over
        } : undefined,
      };
    });

    return {
      vehicle: {
        id: vehicleData.id,
        odometer: vehicleData.odometer,
      },
      slots,
    };

  } catch (err) {
    console.error('Unexpected error in getPartsData:', err);
    return { error: 'Internal server error' };
  }
}
