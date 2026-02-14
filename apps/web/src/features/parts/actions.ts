'use server';

import { createClient } from '@/lib/supabase/server';
import { PartsDataResponse, PartSlot, ComponentType, VehicleInstalledComponent, MasterPart } from './types';

const PART_LIFESPAN_OVERRIDES: Record<string, { miles: number; months: number }> = {
  'Fuel Tank': { miles: 300000, months: 240 }, // 20 years
}

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

    const definitions = (definitionsData as ComponentType[]).map(def => {
       // Apply Overrides
       const override = PART_LIFESPAN_OVERRIDES[def.name];
       if (override) {
         return {
           ...def,
           default_lifespan_miles: override.miles,
           default_lifespan_months: override.months
         }
       }
       return def
    });

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
        installed_at,
        install_miles,
        purchase_price,
        lifespan_miles,
        lifespan_months,
        status,
        specs,
        parent_id,
        install_group_id,
        inventory_source_id,
        visibility,
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
    
    // Decomposition fields
    parentId?: string;
    installGroupId?: string;
    inventorySourceId?: string;
    visibility?: 'public' | 'hardware' | 'history_only';
  }
): Promise<{ success: true; id: string } | { error: string }> {
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
    const { data: insertData, error: insertError } = await supabase
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
        purchase_price: partData.purchaseCost ?? null,
        specs: partData.specs || null,
        lifespan_miles: partData.customLifespanMiles ?? null,
        lifespan_months: partData.customLifespanMonths ?? null,

        status: partData.status || 'installed',
        quantity: 1, // Default

        // Decomposition
        parent_id: partData.parentId || null,
        install_group_id: partData.installGroupId || null,
        inventory_source_id: partData.inventorySourceId || null,
        visibility: partData.visibility || 'public'
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating inventory item:', insertError);
      return { error: insertError.message };
    }

    if (!insertData || !insertData.id) {
      return { error: 'Failed to create inventory item' };
    }

    return { success: true, id: insertData.id };
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
        ...(updateData.purchaseCost !== undefined && { purchase_price: updateData.purchaseCost ?? null }),
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

export type ComplexPart = {
  name: string;
  partNumber?: string;
  category?: string;
  cost?: number;
  qty?: number;
  hardware?: Array<{
    name: string;
    qty: number;
    cost?: number; // Prorated or individual
  }>
}

export async function installComplexPart(
  vehicleId: string,
  kitData: {
    name: string;
    partNumber?: string;
    vendorLink?: string;
    installedDate?: string;
    installedMileage?: number;
    purchaseCost?: number;
    category?: string;
    lifespanMiles?: number;
    lifespanMonths?: number;
  },
  childParts: ComplexPart[],
  sourceInventoryId?: string // Optional existing inventory ID to convert
): Promise<{ success: true; id: string } | { error: string }> {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'Unauthorized' };

    let kitId = sourceInventoryId;

    // 1. Create or Update the "Kit" (History Only)
    if (sourceInventoryId) {
      // Update existing record
      const { data: updatedKit, error: updateError } = await supabase
        .from('inventory')
        .update({
          name: kitData.name,
          part_number: kitData.partNumber || null,
          purchase_url: kitData.vendorLink || null,
          category: kitData.category || 'other',
          installed_at: kitData.installedDate || null,
          install_miles: kitData.installedMileage || null,
          purchase_price: kitData.purchaseCost || null,
          lifespan_miles: kitData.lifespanMiles || null,
          lifespan_months: kitData.lifespanMonths || null,
          status: 'installed',
          visibility: 'history_only', // Hidden from active build
          // quantity remains as is or 1
        })
        .eq('id', sourceInventoryId)
        .eq('user_id', user.id)
        .select('id')
        .single();

      if (updateError) {
        console.error('Error updating kit source:', updateError);
        return { error: 'Failed to update existing kit record' };
      }
      // kitId is already set
    } else {
      // Create new record
      const { data: kit, error: kitError } = await supabase
        .from('inventory')
        .insert({
          user_id: user.id,
          vehicle_id: vehicleId,
          name: kitData.name,
          part_number: kitData.partNumber || null,
          purchase_url: kitData.vendorLink || null,
          category: kitData.category || 'other',
          installed_at: kitData.installedDate || null,
          install_miles: kitData.installedMileage || null,
          purchase_price: kitData.purchaseCost || null,
          lifespan_miles: kitData.lifespanMiles || null,
          lifespan_months: kitData.lifespanMonths || null,
          status: 'installed',
          visibility: 'history_only', // Hidden from active build
          quantity: 1
        })
        .select('id')
        .single();

      if (kitError || !kit) {
        console.error('Error creating kit:', kitError);
        return { error: 'Failed to create kit record' };
      }
      kitId = kit.id;
    }

    if (!kitId) return { error: 'Failed to determine kit ID' };

    const installGroupId = crypto.randomUUID(); // Group ID for sibling parts

    // 2. Install Child Parts
    for (const part of childParts) {
      const { data: child, error: childError } = await supabase
        .from('inventory')
        .insert({
          user_id: user.id,
          vehicle_id: vehicleId,
          name: part.name,
          part_number: part.partNumber || null,
          category: part.category || kitData.category || 'other', // Inherit or override
          installed_at: kitData.installedDate || null,
          install_miles: kitData.installedMileage || null,
          purchase_price: part.cost || 0, // Split cost logic handled by UI or 0
          lifespan_miles: kitData.lifespanMiles || null,
          lifespan_months: kitData.lifespanMonths || null,
          status: 'installed',
          visibility: 'public', // Show in build
          inventory_source_id: kitId, // Linked to Kit
          install_group_id: installGroupId, // Linked to siblings
          quantity: part.qty || 1
        })
        .select('id')
        .single();

      if (childError || !child) {
        console.error('Error creating child part:', childError);
        // Continue? Or abort? Partial failure risk.
        // For now, log.
        continue;
      }

      // 3. Install Hardware for this Child
      if (part.hardware && part.hardware.length > 0) {
        const hardwareInserts = part.hardware.map(hw => ({
          user_id: user.id,
          vehicle_id: vehicleId,
          name: hw.name,
          category: 'hardware',
          installed_at: kitData.installedDate || null,
          install_miles: kitData.installedMileage || null,
          status: 'installed',
          visibility: 'hardware' as const, // TS cast
          parent_id: child.id, // Attached to Child Part
          inventory_source_id: kitId,
          quantity: hw.qty || 1
        }));

        const { error: hwError } = await supabase
          .from('inventory')
          .insert(hardwareInserts);

        if (hwError) console.error('Error creating hardware:', hwError);
      }
    }

    return { success: true, id: kitId };
  } catch (err) {
    console.error('Unexpected error in installComplexPart:', err);
    return { error: 'Internal server error' };
  }
}

export async function deletePart(partId: string): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'Unauthorized' };

    // Check if part exists and belongs to user
    const { data: part, error: fetchError } = await supabase
      .from('inventory')
      .select('id, user_id, inventory_source_id')
      .eq('id', partId)
      .single();

    if (fetchError || !part) return { error: 'Part not found' };
    if (part.user_id !== user.id) return { error: 'Unauthorized' };

    // If it's a child part of a kit, just delete it (it'll be removed from public view)
    // If it's a standalone part, delete it.
    // Ideally, if it's a kit child, we might want to warn, but user asked for delete.

    const { error: deleteError } = await supabase
      .from('inventory')
      .delete()
      .eq('id', partId);

    if (deleteError) {
      console.error('Error deleting part:', deleteError);
      return { error: deleteError.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error in deletePart:', err);
    return { error: 'Internal server error' };
  }
}