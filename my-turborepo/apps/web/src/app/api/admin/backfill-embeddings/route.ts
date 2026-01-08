
import { createClient } from '@/lib/supabase/server';
import { generateVehicleEmbedding } from '@/lib/embeddings';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Auth Check - Verify User
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Admin Check
        const { data: profile, error: profileError } = await supabase
            .from('user_profile')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (profileError || !profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // 3. Select batch of vehicles with missing embeddings
        // Limiting to 20 to avoid timeouts (Vercel functions have strict limits)
        const BATCH_SIZE = 20;
        const { data: vehicles, error: fetchError } = await supabase
            .from('vehicle_data')
            .select('*')
            .is('description_embedding', null)
            .limit(BATCH_SIZE);

        if (fetchError) {
            console.error('Error fetching vehicles:', fetchError);
            return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
        }

        if (!vehicles || vehicles.length === 0) {
            return NextResponse.json({ message: 'No vehicles pending embeddings.' });
        }

        // 4. Process Batch
        let processedCount = 0;
        const errors = [];

        for (const vehicle of vehicles) {
            try {
                // Cast DB result to Vehicle type-like structure expected by embedder
                // The embedder only needs year, make, model, trim, trim_description
                const embedding = await generateVehicleEmbedding(vehicle as any);

                // 5. Update only the embedding column
                const { error: updateError } = await supabase
                    .from('vehicle_data')
                    .update({ description_embedding: embedding })
                    .eq('id', vehicle.id);

                if (updateError) {
                    throw updateError;
                }

                processedCount++;
            } catch (err: any) {
                console.error(`Error processing vehicle ${vehicle.id}:`, err);
                errors.push({ id: vehicle.id, error: err.message });
            }
        }

        // 6. Return Summary
        // Fetch remaining count for progress tracking
        const { count: remainingCount } = await supabase
            .from('vehicle_data')
            .select('*', { count: 'exact', head: true })
            .is('description_embedding', null);

        return NextResponse.json({
            message: `Processed ${processedCount} vehicles.`,
            processed: processedCount,
            errors: errors.length > 0 ? errors : undefined,
            remaining: remainingCount,
            next_batch: remainingCount ? remainingCount > 0 : false
        });

    } catch (error: any) {
        console.error('Internal Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
