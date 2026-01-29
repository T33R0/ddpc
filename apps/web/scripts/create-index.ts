
import postgres from 'postgres';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load envs
config({ path: path.resolve(__dirname, '../.env.local') });
config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ Missing DATABASE_URL in .env.local');
    console.error('Please add it: DATABASE_URL="postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"');
    process.exit(1);
}

// Disable idle timeout to allow long queries
const sql = postgres(connectionString, {
    idle_timeout: 0,
    connect_timeout: 30,
    max_lifetime: 0,
});

async function run() {
    console.log('🔌 Connecting to database...');

    try {
        console.log('🚀 Creating IVFFlat Index... (This may take a few seconds)');

        // We run the raw SQL here
        await sql`
      drop index if exists vehicle_description_embedding_idx;
      create index vehicle_description_embedding_idx
      on vehicle_data
      using ivfflat (description_embedding vector_cosine_ops)
      with (lists = 300);
    `;

        console.log('✅ Index created successfully!');
    } catch (err: any) {
        console.error('❌ Failed to create index:', err.message);
    } finally {
        await sql.end();
    }
}

run();
