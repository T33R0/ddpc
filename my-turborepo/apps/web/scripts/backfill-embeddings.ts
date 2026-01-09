
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load envs FIRST, before importing libraries that rely on them
config({ path: path.resolve(__dirname, '../.env.local') });
config({ path: path.resolve(__dirname, '../.env') });

// Check keys immediately
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}
if (!process.env.AI_GATEWAY_API_KEY) {
    console.error('❌ Missing AI_GATEWAY_API_KEY in .env.local');
    process.exit(1);
}

// Dynamically import the embedder so it sees the populated env vars
// This solves the "Missing Authorization header" issue
const { generateVehicleEmbedding } = await import('../src/lib/embeddings');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function backfill() {
    console.log('Starting backfill...');

    let hasMore = true;
    let totalProcessed = 0;

    while (hasMore) {
        // Fetch batch
        const { data: vehicles, error } = await supabase
            .from('vehicle_data')
            .select('*')
            .is('description_embedding', null)
            .limit(10);

        if (error) {
            console.error('Error fetching vehicles:', error);
            break;
        }

        if (!vehicles || vehicles.length === 0) {
            console.log('No more vehicles to process.');
            hasMore = false;
            break;
        }

        console.log(`Processing batch of ${vehicles.length} vehicles...`);

        // Process in parallel
        await Promise.all(vehicles.map(async (vehicle) => {
            try {
                const embedding = await generateVehicleEmbedding(vehicle as any);

                // Update and confirm it actually worked
                const { data: updated, error: updateError } = await supabase
                    .from('vehicle_data')
                    .update({ description_embedding: embedding })
                    .eq('id', vehicle.id)
                    .select();

                if (updateError) throw updateError;

                if (!updated || updated.length === 0) {
                    console.warn(`\n⚠️ Update returned no data for ${vehicle.id}. RLS might be blocking it.`);
                }

                process.stdout.write('.'); // Progress dot
            } catch (err: any) {
                console.error(`\nFailed to process vehicle ${vehicle.id}:`, err.message);
            }
        }));

        totalProcessed += vehicles.length;
        console.log(`\nBatch done. Total processed: ${totalProcessed}`);

        // Tiny pause
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('\nBackfill complete!');
}

backfill().catch(console.error);
