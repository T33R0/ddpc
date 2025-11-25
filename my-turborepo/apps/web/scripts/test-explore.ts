
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFilters() {
    console.log('Testing get_vehicle_filter_options...');
    const { data, error } = await supabase.rpc('get_vehicle_filter_options');
    if (error) {
        console.error('Error fetching filters:', error);
    } else {
        console.log('Filters fetched successfully:', data ? 'Data present' : 'No data');
    }
}

async function testSearch() {
    console.log('Testing get_unique_vehicles_with_trims with "2008 BMW"...');
    const { data, error } = await supabase.rpc('get_unique_vehicles_with_trims', {
        limit_param: 10,
        search_query: '2008 BMW'
    });

    if (error) {
        console.error('Error fetching search results:', error);
    } else {
        console.log(`Found ${data ? data.length : 0} results for "2008 BMW"`);
        if (data && data.length > 0) {
            console.log('First result:', data[0].id);
        }
    }

    console.log('Testing get_unique_vehicles_with_trims with "BMW"...');
    const { data: data2, error: error2 } = await supabase.rpc('get_unique_vehicles_with_trims', {
        limit_param: 10,
        search_query: 'BMW'
    });

    if (error2) {
        console.error('Error fetching search results (BMW):', error2);
    } else {
        console.log(`Found ${data2 ? data2.length : 0} results for "BMW"`);
    }
}

async function run() {
    await testFilters();
    await testSearch();
}

run();
