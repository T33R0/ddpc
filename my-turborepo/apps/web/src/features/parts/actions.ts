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
    customLifespanMiles?: number;
    customLifespanMonths?: number;
    status?: 'installed' | 'planned';
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
          purchase_cost: partData.purchaseCost || null,
          custom_lifespan_miles: partData.customLifespanMiles || null,
          custom_lifespan_months: partData.customLifespanMonths || null,
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
          purchase_cost: partData.purchaseCost || null,
          custom_lifespan_miles: partData.customLifespanMiles || null,
          custom_lifespan_months: partData.customLifespanMonths || null,
          status: partData.status || 'installed',
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

export async function updatePartInstallation(
  installationId: string,
  vehicleId: string,
  updateData: {
    installedDate?: string;
    installedMileage?: number;
    purchaseCost?: number;
    customLifespanMiles?: number;
    customLifespanMonths?: number;
    partName?: string;
    partNumber?: string;
    partNumber?: string;
    vendorLink?: string;
    status?: 'installed' | 'planned';
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

    // Update master part if part details changed
    if (updateData.partName || updateData.partNumber || updateData.vendorLink) {
      // Get current installation to find master part
      const { data: currentInstall, error: fetchError } = await supabase
        .from('vehicle_installed_components')
        .select('current_part_id')
        .eq('id', installationId)
        .single();

      if (!fetchError && currentInstall) {
        const { error: updatePartError } = await supabase
          .from('master_parts_list')
          .update({
            ...(updateData.partName && { name: updateData.partName }),
            ...(updateData.partNumber !== undefined && { part_number: updateData.partNumber || null }),
            ...(updateData.vendorLink !== undefined && { vendor_link: updateData.vendorLink || null }),
          })
          .eq('id', currentInstall.current_part_id);

        if (updatePartError) {
          console.error('Error updating master part:', updatePartError);
          return { error: 'Failed to update part details' };
        }
      }
    }

    // Update installation record
    const { error: updateError } = await supabase
      .from('vehicle_installed_components')
      .update({
        ...(updateData.installedDate !== undefined && { installed_date: updateData.installedDate || null }),
        ...(updateData.installedMileage !== undefined && { installed_mileage: updateData.installedMileage || null }),
        ...(updateData.purchaseCost !== undefined && { purchase_cost: updateData.purchaseCost || null }),
        ...(updateData.customLifespanMiles !== undefined && { custom_lifespan_miles: updateData.customLifespanMiles || null }),
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