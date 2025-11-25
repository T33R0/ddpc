
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

console.log('Using Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFilters() {
    console.log('\n--- Testing get_vehicle_filter_options ---');
    const { data, error } = await supabase.rpc('get_vehicle_filter_options');
    if (error) {
        console.error('ERROR fetching filters:', error);
    } else {
        console.log('SUCCESS: Filters fetched.');
        if (data) {
            console.log('Years count:', data.years ? data.years.length : 0);
            console.log('Makes count:', data.makes ? data.makes.length : 0);
        } else {
            console.log('Data is null/empty');
        }
    }
}

async function testSearch() {
    console.log('\n--- Testing get_unique_vehicles_with_trims (Search) ---');

    // Test 1: Multi-term search (Expected to fail currently)
    console.log('Query: "2008 BMW"');
    const { data, error } = await supabase.rpc('get_unique_vehicles_with_trims', {
        limit_param: 10,
        search_query: '2008 BMW'
    });

    if (error) {
        console.error('ERROR:', error);
    } else {
        console.log(`Results found: ${data ? data.length : 0}`);
        if (data && data.length > 0) console.log('First match:', data[0].id);
    }

    // Test 2: Single-term search (Expected to work)
    console.log('\nQuery: "BMW"');
    const { data: data2, error: error2 } = await supabase.rpc('get_unique_vehicles_with_trims', {
        limit_param: 10,
        search_query: 'BMW'
    });

    if (error2) {
        console.error('ERROR:', error2);
    } else {
        console.log(`Results found: ${data2 ? data2.length : 0}`);
    }
}

async function checkRLS() {
    console.log('\n--- Checking RLS on vehicle_data ---');

    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (anonKey) {
        const publicClient = createClient(supabaseUrl, anonKey);
        const { data, error } = await publicClient.from('vehicle_data').select('id').limit(1);
        if (error) {
            console.error('Public Access Check (Anon Key): FAILED');
            console.error(error);
        } else {
            console.log('Public Access Check (Anon Key): SUCCESS');
        }
    }
}

async function run() {
    await checkRLS();
    await testSearch();
    await testFilters();
}

run();
