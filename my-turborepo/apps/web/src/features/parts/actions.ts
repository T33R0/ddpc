'use server';

import { createClient } from '@/lib/supabase/server';
import { PartsDataResponse, PartSlot, ComponentType, VehicleInstalledComponent, MasterPart } from './types';

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

    // 2. Fetch All Component Types (Slots)
    const { data: definitionsData, error: definitionsError } = await supabase
      .from('component_types')
      .select('*');

    if (definitionsError) {
      console.error('Error fetching component types:', definitionsError);
      return { error: 'Failed to fetch component types' };
    }

    const definitions = definitionsData as ComponentType[];

    // 3. Fetch Inventory Items for this Vehicle (Replacting vehicle_installed_components)
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory')
      .select(`
        id,
        vehicle_id,
        component_definition_id,
        category,
        name,
        part_number,
        variant,
        purchase_url,
        category,
        installed_at,
        install_miles,
        purchase_price,
        lifespan_miles,
        lifespan_months,
        status,
        master_part:master_parts (
          id,
          name,
          part_number,
          affiliate_url,
          category
        )
      `)
      .eq('vehicle_id', vehicleId); // Filter by vehicle_id directly on inventory

    if (inventoryError) {
      console.error('Error fetching inventory:', inventoryError);
      return { error: `Failed to fetch installed components: ${inventoryError.message}` };
    }

    // Cast the joined data correctly
    const installedComponents = inventoryData as unknown as VehicleInstalledComponent[];

    // 4. Combine Definitions with Inventory Data
    const slots: PartSlot[] = definitions.map((def) => {
      // Find the inventory item linked to this slot (definition_id)
      // Note: inventory might not have category populated if not added via this flow
      const installed = installedComponents.find(
        (item) => item.component_definition_id === def.id
      );

      return {
        ...def,
        installedComponent: installed,
      };
    });

    return {
      vehicle: {
        id: vehicleData.id,
        odometer: vehicleData.odometer,
      },
      slots,
      inventory: installedComponents,
    };

  } catch (err) {
    console.error('Unexpected error in getPartsData:', err);
    return { error: 'Internal server error' };
  }
}

export async function addPartToVehicle(
  vehicleId: string,
  componentDefinitionId: string | null,
  partData: {
    name: string;
    partNumber?: string;
    vendorLink?: string;
    installedDate?: string;
    installedMileage?: number;
    purchaseCost?: number;
    customLifespanMiles?: number;
    customLifespanMonths?: number;
    category?: string;
    variant?: string;

    status?: 'installed' | 'planned';
    specs?: Record<string, any>;
    bomId?: string;
  }
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'Unauthorized' };

    // Verify vehicle ownership
    const { data: vehicle, error: vehicleError } = await supabase
      .from('user_vehicle')
      .select('id, owner_id')
      .eq('id', vehicleId)
      .eq('owner_id', user.id)
      .single();

    if (vehicleError || !vehicle) return { error: 'Vehicle not found or access denied' };

    // 1. Lookup Master Part for Enrichment (Optional)
    let masterPartId: string | null = null;
    let categoryToUse = partData.category;
    let vendorLinkToUse = partData.vendorLink;

    if (partData.partNumber) {
      const { data: masterPart } = await supabase
        .from('master_parts')
        .select('id, category, purchase_url')
        .eq('part_number', partData.partNumber)
        .single();

      if (masterPart) {
        masterPartId = masterPart.id;
        if (!categoryToUse) categoryToUse = masterPart.category;
        if (!vendorLinkToUse) vendorLinkToUse = masterPart.purchase_url;
      }
    }

    // 2. Insert into Inventory (This REPLACES creating vehicle_installed_components)
    // We are adding a part to the user's inventory AND installing it on the vehicle simultaneously
    const { error: insertError } = await supabase
      .from('inventory')
      .insert({
        user_id: user.id,
        vehicle_id: vehicleId, // Link directly to vehicle
        // Determine proper values for category vs component_definition_id
        // If componentDefinitionId is a UUID, it's a real slot link. If it's a "blueprint-" string, it's virtual.
        // category column should hold the broad category (e.g. "engine")
        component_definition_id: (componentDefinitionId && !componentDefinitionId.startsWith('blueprint-')) ? componentDefinitionId : null,
        category: partData.category || 'engine', // Ensure we save the string category for filtering

        name: partData.name,
        part_number: partData.partNumber || null,
        variant: partData.variant || null,
        purchase_url: vendorLinkToUse || null,

        master_part_id: masterPartId || null, // Link to master catalog if found

        installed_at: partData.installedDate || null,
        install_miles: partData.installedMileage || null,
        purchase_price: partData.purchaseCost || null,
        specs: partData.specs || null,
        lifespan_miles: partData.customLifespanMiles ?? null,
        lifespan_months: partData.customLifespanMonths ?? null,

        status: partData.status || 'installed',
        quantity: 1 // Default
      });

    if (insertError) {
      console.error('Error creating inventory item:', insertError);
      return { error: insertError.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error in addPartToVehicle:', err);
    return { error: 'Internal server error' };
  }
}

export async function updatePartInstallation(
  installationId: string, // This is now the inventory.id
  vehicleId: string,
  updateData: {
    installedDate?: string;
    installedMileage?: number;
    purchaseCost?: number;
    customLifespanMiles?: number;
    customLifespanMonths?: number;
    partName?: string;
    partNumber?: string;
    vendorLink?: string;
    category?: string;
    variant?: string;
    status?: 'installed' | 'planned';
    specs?: Record<string, any>;
  }
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'Unauthorized' };

    // Update Inventory Record Directly
    const { error: updateError } = await supabase
      .from('inventory')
      .update({
        ...(updateData.partName && { name: updateData.partName }),
        ...(updateData.partNumber !== undefined && { part_number: updateData.partNumber || null }),
        ...(updateData.vendorLink !== undefined && { purchase_url: updateData.vendorLink || null }),
        ...(updateData.category !== undefined && { category: updateData.category || null }),
        ...(updateData.variant !== undefined && { variant: updateData.variant || null }),
        // We don't update component_definition_id here as it typically doesn't change after install unless re-assigned

        ...(updateData.installedDate !== undefined && { installed_at: updateData.installedDate || null }),
        ...(updateData.installedMileage !== undefined && { install_miles: updateData.installedMileage || null }),
        ...(updateData.purchaseCost !== undefined && { purchase_price: updateData.purchaseCost || null }),
        ...(updateData.customLifespanMiles !== undefined && { lifespan_miles: updateData.customLifespanMiles ?? null }),
        ...(updateData.customLifespanMonths !== undefined && { lifespan_months: updateData.customLifespanMonths ?? null }),
        ...(updateData.specs && { specs: updateData.specs }),
        ...(updateData.status && { status: updateData.status }),
      })
      .eq('id', installationId)
      .eq('user_id', user.id); // Ensure ownership

    if (updateError) {
      console.error('Error updating inventory:', updateError);
      return { error: updateError.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error in updatePartInstallation:', err);
    return { error: 'Internal server error' };
  }
}