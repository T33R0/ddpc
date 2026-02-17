'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { VehicleFluid, FluidChange, FluidWithHealth, FluidType, FluidChangeReason } from './types';

/**
 * Calculates fluid health as a percentage (0-100) using worst-case
 * of mileage-based and time-based remaining life.
 */
function calculateFluidHealth(
    fluid: VehicleFluid,
    currentOdometer: number
): { percent: number; status: 'good' | 'warning' | 'critical'; milesRemaining: number | null; monthsRemaining: number | null } {
    let milesPercent: number | null = null;
    let monthsPercent: number | null = null;
    let milesRemaining: number | null = null;
    let monthsRemaining: number | null = null;

    // Mileage-based
    if (fluid.lifespan_miles && fluid.last_changed_miles) {
        const milesSinceChange = currentOdometer - fluid.last_changed_miles;
        milesRemaining = fluid.lifespan_miles - milesSinceChange;
        milesPercent = Math.max(0, Math.min(100, (milesRemaining / fluid.lifespan_miles) * 100));
    }

    // Time-based
    if (fluid.lifespan_months && fluid.last_changed_at) {
        const changedDate = new Date(fluid.last_changed_at);
        const now = new Date();
        const monthsElapsed = (now.getTime() - changedDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
        monthsRemaining = fluid.lifespan_months - monthsElapsed;
        monthsPercent = Math.max(0, Math.min(100, (monthsRemaining / fluid.lifespan_months) * 100));
    }

    // Worst-case (lowest) of the two
    let percent = 100;
    if (milesPercent !== null && monthsPercent !== null) {
        percent = Math.min(milesPercent, monthsPercent);
    } else if (milesPercent !== null) {
        percent = milesPercent;
    } else if (monthsPercent !== null) {
        percent = monthsPercent;
    }

    const status = percent <= 10 ? 'critical' : percent <= 30 ? 'warning' : 'good';

    return { percent: Math.round(percent), status, milesRemaining: milesRemaining ? Math.round(milesRemaining) : null, monthsRemaining: monthsRemaining ? Math.round(monthsRemaining * 10) / 10 : null };
}

/**
 * Fetches all fluids for a vehicle with calculated health.
 */
export async function getVehicleFluids(vehicleId: string): Promise<{ fluids: FluidWithHealth[] } | { error: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Fetch vehicle odometer
    const { data: vehicle } = await supabase
        .from('user_vehicle')
        .select('odometer')
        .eq('id', vehicleId)
        .single();

    if (!vehicle) return { error: 'Vehicle not found' };

    // Fetch fluids with recent changes
    const { data: fluids, error } = await supabase
        .from('vehicle_fluids')
        .select(`
            *,
            changes:fluid_changes(*)
        `)
        .eq('vehicle_id', vehicleId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) return { error: error.message };

    const fluidsWithHealth: FluidWithHealth[] = (fluids || []).map((fluid: VehicleFluid & { changes?: FluidChange[] }) => {
        const health = calculateFluidHealth(fluid, vehicle.odometer || 0);
        return {
            ...fluid,
            health_percent: health.percent,
            health_status: health.status,
            miles_remaining: health.milesRemaining,
            months_remaining: health.monthsRemaining,
        };
    });

    return { fluids: fluidsWithHealth };
}

/**
 * Adds a new fluid to a vehicle.
 */
export async function addFluid(
    vehicleId: string,
    data: {
        name: string;
        fluidType: FluidType;
        specification?: string;
        capacity?: string;
        lastChangedAt?: string;
        lastChangedMiles?: number;
        lifespanMonths?: number;
        lifespanMiles?: number;
        notes?: string;
    }
): Promise<{ success: true; id: string } | { error: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: fluid, error } = await supabase
        .from('vehicle_fluids')
        .insert({
            vehicle_id: vehicleId,
            user_id: user.id,
            name: data.name,
            fluid_type: data.fluidType,
            specification: data.specification || null,
            capacity: data.capacity || null,
            last_changed_at: data.lastChangedAt || null,
            last_changed_miles: data.lastChangedMiles || null,
            lifespan_months: data.lifespanMonths || null,
            lifespan_miles: data.lifespanMiles || null,
            status: 'active',
            notes: data.notes || null,
        })
        .select('id')
        .single();

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true, id: fluid.id };
}

/**
 * Records a fluid change event. Updates the fluid's last_changed fields
 * and creates a history entry.
 */
export async function recordFluidChange(
    fluidId: string,
    data: {
        changedAt: string;
        odometer?: number;
        newSpecification?: string;
        changeReason?: FluidChangeReason;
        cost?: number;
        notes?: string;
        jobId?: string;
    }
): Promise<{ success: true } | { error: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Fetch current fluid to get its specification
    const { data: fluid } = await supabase
        .from('vehicle_fluids')
        .select('specification, user_id')
        .eq('id', fluidId)
        .single();

    if (!fluid) return { error: 'Fluid not found' };
    if (fluid.user_id !== user.id) return { error: 'Unauthorized' };

    // Create change history entry
    const { error: changeError } = await supabase
        .from('fluid_changes')
        .insert({
            fluid_id: fluidId,
            job_id: data.jobId || null,
            changed_at: data.changedAt,
            odometer: data.odometer || null,
            old_specification: fluid.specification,
            new_specification: data.newSpecification || fluid.specification || '',
            change_reason: data.changeReason || 'scheduled',
            cost: data.cost || null,
            notes: data.notes || null,
        });

    if (changeError) return { error: changeError.message };

    // Update the fluid record with new change info
    const updates: Record<string, unknown> = {
        last_changed_at: data.changedAt,
        status: 'active',
        updated_at: new Date().toISOString(),
    };
    if (data.odometer) updates.last_changed_miles = data.odometer;
    if (data.newSpecification) updates.specification = data.newSpecification;

    const { error: updateError } = await supabase
        .from('vehicle_fluids')
        .update(updates)
        .eq('id', fluidId);

    if (updateError) return { error: updateError.message };

    revalidatePath('/vehicle');
    return { success: true };
}

/**
 * Updates a fluid record.
 */
export async function updateFluid(
    fluidId: string,
    data: Partial<{
        name: string;
        fluidType: FluidType;
        specification: string;
        capacity: string;
        lifespanMonths: number;
        lifespanMiles: number;
        notes: string;
    }>
): Promise<{ success: true } | { error: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) updates.name = data.name;
    if (data.fluidType !== undefined) updates.fluid_type = data.fluidType;
    if (data.specification !== undefined) updates.specification = data.specification;
    if (data.capacity !== undefined) updates.capacity = data.capacity;
    if (data.lifespanMonths !== undefined) updates.lifespan_months = data.lifespanMonths;
    if (data.lifespanMiles !== undefined) updates.lifespan_miles = data.lifespanMiles;
    if (data.notes !== undefined) updates.notes = data.notes;

    const { error } = await supabase
        .from('vehicle_fluids')
        .update(updates)
        .eq('id', fluidId)
        .eq('user_id', user.id);

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true };
}

/**
 * Deletes a fluid and its change history.
 */
export async function deleteFluid(fluidId: string): Promise<{ success: true } | { error: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { error } = await supabase
        .from('vehicle_fluids')
        .delete()
        .eq('id', fluidId)
        .eq('user_id', user.id);

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true };
}
