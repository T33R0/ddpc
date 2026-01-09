
import { createClient } from '@supabase/supabase-js';
import { generateVehicleEmbedding } from '../src/lib/embeddings';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading from .env if .env.local is missing (or relying on system envs)
config({ path: path.resolve(__dirname, '../.env.local') });
config({ path: path.resolve(__dirname, '../.env') }); // Fallback to .env

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in apps/web/.env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

                const { error: updateError } = await supabase
                    .from('vehicle_data')
                    .update({ description_embedding: embedding })
                    .eq('id', vehicle.id);

                if (updateError) throw updateError;

                process.stdout.write('.'); // Progress dot
            } catch (err: any) {
                console.error(`\nFailed to process vehicle ${vehicle.id}:`, err.message);
            }
        }));

        totalProcessed += vehicles.length;
        console.log(`\nBatch done. Total processed: ${totalProcessed}`);

        // Tiny pause to avoid hitting rate limits too hard
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('\nBackfill complete!');
}

backfill().catch(console.error);
