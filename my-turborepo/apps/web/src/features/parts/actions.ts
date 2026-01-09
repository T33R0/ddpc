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

export async function addPartToVehicle(
  vehicleId: string,
  componentDefinitionId: string,
  partData: {
    name: string;
    partNumber?: string;
    vendorLink?: string;
    installedDate?: string;
    installedMileage?: number;
  }
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();

  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // Verify vehicle ownership
    const { data: vehicle, error: vehicleError } = await supabase
      .from('user_vehicle')
      .select('id, owner_id')
      .eq('id', vehicleId)
      .eq('owner_id', user.id)
      .single();

    if (vehicleError || !vehicle) {
      return { error: 'Vehicle not found or access denied' };
    }

    // 1. Create or find master part
    let masterPartId: string;

    // Check if a master part with the same name and part number already exists
    if (partData.partNumber) {
      const { data: existingPart } = await supabase
        .from('master_parts_list')
        .select('id')
        .eq('name', partData.name)
        .eq('part_number', partData.partNumber)
        .single();

      if (existingPart) {
        masterPartId = existingPart.id;
      } else {
        // Create new master part
        const { data: newPart, error: createError } = await supabase
          .from('master_parts_list')
          .insert({
            name: partData.name,
            part_number: partData.partNumber || null,
            vendor_link: partData.vendorLink || null,
          })
          .select('id')
          .single();

        if (createError || !newPart) {
          console.error('Error creating master part:', createError);
          return { error: createError?.message || 'Failed to create part. Please check database permissions.' };
        }
        masterPartId = newPart.id;
      }
    } else {
      // No part number, just create a new master part
      const { data: newPart, error: createError } = await supabase
        .from('master_parts_list')
        .insert({
          name: partData.name,
          part_number: null,
          vendor_link: partData.vendorLink || null,
        })
        .select('id')
        .single();

      if (createError || !newPart) {
        console.error('Error creating master part:', createError);
        return { error: createError?.message || 'Failed to create part. Please check database permissions.' };
      }
      masterPartId = newPart.id;
    }

    // 2. Check if there's already an installed component for this slot
    const { data: existingInstall } = await supabase
      .from('vehicle_installed_components')
      .select('id')
      .eq('user_vehicle_id', vehicleId)
      .eq('component_definition_id', componentDefinitionId)
      .single();

    if (existingInstall) {
      // Update existing installation
      const { error: updateError } = await supabase
        .from('vehicle_installed_components')
        .update({
          current_part_id: masterPartId,
          installed_date: partData.installedDate || null,
          installed_mileage: partData.installedMileage || null,
        })
        .eq('id', existingInstall.id);

      if (updateError) {
        console.error('Error updating installed component:', updateError);
        return { error: 'Failed to update part installation' };
      }
    } else {
      // Create new installation
      const { error: insertError } = await supabase
        .from('vehicle_installed_components')
        .insert({
          user_vehicle_id: vehicleId,
          component_definition_id: componentDefinitionId,
          current_part_id: masterPartId,
          installed_date: partData.installedDate || null,
          installed_mileage: partData.installedMileage || null,
        });

      if (insertError) {
        console.error('Error creating installed component:', insertError);
        return { error: insertError?.message || 'Failed to install part. Please check database permissions.' };
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error in addPartToVehicle:', err);
    return { error: 'Internal server error' };
  }
}