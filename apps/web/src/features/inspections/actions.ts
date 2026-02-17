'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Inspection, InspectionFinding, InspectionType, FindingSeverity } from './types';

/**
 * Records a vehicle inspection with its findings.
 * Creates the inspection record and all findings atomically.
 */
export async function recordInspection(
    vehicleId: string,
    data: {
        inspectionDate: string;
        odometer?: number;
        inspectionType: InspectionType;
        summary?: string;
        notes?: string;
        findings: Array<{
            finding: string;
            severity: FindingSeverity;
            inventoryId?: string;
            fluidId?: string;
            actionTaken?: string;
        }>;
    }
): Promise<{ success: true; inspectionId: string; findingIds: string[] } | { error: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Verify vehicle ownership
    const { data: vehicle } = await supabase
        .from('user_vehicle')
        .select('id, owner_id')
        .eq('id', vehicleId)
        .eq('owner_id', user.id)
        .single();

    if (!vehicle) return { error: 'Vehicle not found or access denied' };

    // Create inspection record
    const { data: inspection, error: inspError } = await supabase
        .from('inspections')
        .insert({
            vehicle_id: vehicleId,
            user_id: user.id,
            inspection_date: data.inspectionDate,
            odometer: data.odometer || null,
            inspection_type: data.inspectionType,
            summary: data.summary || null,
            notes: data.notes || null,
        })
        .select('id')
        .single();

    if (inspError) return { error: inspError.message };

    // Create findings
    const findingIds: string[] = [];
    if (data.findings.length > 0) {
        const findingsData = data.findings.map(f => ({
            inspection_id: inspection.id,
            finding: f.finding,
            severity: f.severity,
            inventory_id: f.inventoryId || null,
            fluid_id: f.fluidId || null,
            action_taken: f.actionTaken || null,
            status: 'open' as const,
        }));

        const { data: createdFindings, error: findingsError } = await supabase
            .from('inspection_findings')
            .insert(findingsData)
            .select('id');

        if (findingsError) {
            console.error('[recordInspection] Failed to create findings:', findingsError);
        } else if (createdFindings) {
            findingIds.push(...createdFindings.map(f => f.id));
        }
    }

    // Update vehicle odometer if higher
    if (data.odometer) {
        await supabase
            .from('user_vehicle')
            .update({ odometer: data.odometer })
            .eq('id', vehicleId)
            .lt('odometer', data.odometer);
    }

    revalidatePath('/vehicle');
    return { success: true, inspectionId: inspection.id, findingIds };
}

/**
 * Fetches all inspections for a vehicle with their findings.
 */
export async function getVehicleInspections(vehicleId: string): Promise<{ inspections: Inspection[] } | { error: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: inspections, error } = await supabase
        .from('inspections')
        .select(`
            *,
            findings:inspection_findings(*)
        `)
        .eq('vehicle_id', vehicleId)
        .eq('user_id', user.id)
        .order('inspection_date', { ascending: false });

    if (error) return { error: error.message };
    return { inspections: (inspections || []) as Inspection[] };
}

/**
 * Returns all unresolved findings for a vehicle.
 * Used by the "Needs Attention" system.
 */
export async function getOpenFindings(vehicleId: string): Promise<{ findings: InspectionFinding[] } | { error: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Get inspection IDs for this vehicle
    const { data: inspections } = await supabase
        .from('inspections')
        .select('id')
        .eq('vehicle_id', vehicleId)
        .eq('user_id', user.id);

    if (!inspections || inspections.length === 0) return { findings: [] };

    const inspectionIds = inspections.map(i => i.id);

    const { data: findings, error } = await supabase
        .from('inspection_findings')
        .select('*')
        .in('inspection_id', inspectionIds)
        .in('status', ['open', 'monitoring'])
        .order('severity', { ascending: true }); // critical first

    if (error) return { error: error.message };
    return { findings: (findings || []) as InspectionFinding[] };
}

/**
 * Resolves an inspection finding by linking it to the job that fixed it.
 */
export async function resolveInspectionFinding(
    findingId: string,
    jobId: string
): Promise<{ success: true } | { error: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { error } = await supabase
        .from('inspection_findings')
        .update({
            resolved_job_id: jobId,
            status: 'resolved',
        })
        .eq('id', findingId);

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true };
}

/**
 * Updates the status of a finding (e.g., open → monitoring).
 */
export async function updateFindingStatus(
    findingId: string,
    status: 'open' | 'monitoring' | 'resolved',
    actionTaken?: string
): Promise<{ success: true } | { error: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const updates: Record<string, unknown> = { status };
    if (actionTaken) updates.action_taken = actionTaken;

    const { error } = await supabase
        .from('inspection_findings')
        .update(updates)
        .eq('id', findingId);

    if (error) return { error: error.message };
    revalidatePath('/vehicle');
    return { success: true };
}
