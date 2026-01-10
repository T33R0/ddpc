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
        id,
        user_vehicle_id,
        component_definition_id,
        current_part_id,
        installed_date,
        installed_mileage,
        custom_lifespan_miles,
        custom_lifespan_months,
        purchase_cost,
        status,
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

export async function addPartToVehicle(
  vehicleId: string,
  componentDefinitionId: string,
  partData: {
    name: string;
    partNumber?: string;
    vendorLink?: string;
    installedDate?: string;
    installedMileage?: number;
    purchaseCost?: number;
    customLifespanMiles?: number;
    customLifespanMonths?: number;
    status?: 'installed' | 'planned';
  }
): Promise<{ success: true } | { error: string }> {
  // ... (skipping unchanged lines)
  updateData: {
    installedDate ?: string;
    installedMileage ?: number;
    purchaseCost ?: number;
    customLifespanMiles ?: number;
    customLifespanMonths ?: number;
    partName ?: string;
    partNumber ?: string;
    vendorLink ?: string;
    status ?: 'installed' | 'planned';
  }
// ...
      .update({
    ...(updateData.installedDate !== undefined && { installed_date: updateData.installedDate || null }),
    ...(updateData.installedMileage !== undefined && { installed_mileage: updateData.installedMileage || null }),
    ...(updateData.purchaseCost !== undefined && { purchase_cost: updateData.purchaseCost || null }),
    ...(updateData.customLifespanMiles !== undefined && { custom_lifespan_miles: updateData.customLifespanMiles || null }),
    ...(updateData.customLifespanMonths !== undefined && { custom_lifespan_months: updateData.customLifespanMonths || null }),
    ...(updateData.status && { status: updateData.status }),
  })
    .eq('id', installationId);

  if (updateError) {
    console.error('Error updating installation:', updateError);
    return { error: updateError?.message || 'Failed to update installation' };
  }

  return { success: true };
} catch (err) {
  console.error('Unexpected error in updatePartInstallation:', err);
  return { error: 'Internal server error' };
}
}