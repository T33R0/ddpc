import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables
const envPath = path.resolve(process.cwd(), 'apps/web/.env.local')
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Anon Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testVehicleAddition() {
    console.log('Starting vehicle addition test...')

    // 1. Login (we need to be authenticated for RLS usually)
    // Since we don't have a user/pass easily, we might hit "anonymous" RLS limits if we don't sign in.
    // However, the issue report worked with Anon key but maybe that policy was "public".
    // user_vehicle usually requires authentication.
    // I will try to sign in with a dummy user if possible, or just check if I can insert as anon (unlikely).
    // Actually, I'll try to insert as anon first. If it fails with "new row violates...", it confirms RLS is active.
    // But we WANT to know if it fails for *authenticated* users.
    // Without a user token, I can't fully reproduce the "authenticated user" scenario.
    // BUT, if I can't sign in, I can't test "owner_id".

    // Alternative: I will try to fetch a public vehicle first to see if READ works.

    console.log('Step 1: Fetching a random stock vehicle to use as template...')
    const { data: stockVehicle, error: stockError } = await supabase
        .from('vehicle_data')
        .select('id, year, make, model, trim')
        .limit(1)
        .single()

    if (stockError || !stockVehicle) {
        console.error('Failed to fetch stock vehicle:', stockError)
        return
    }
    console.log('Found stock vehicle:', stockVehicle.id)

    // 2. Attempt Insert into user_vehicle
    console.log('Step 2: Attempting insert into user_vehicle...')
    // Note: This will likely fail because we are not authenticated and owner_id is required/checked.
    // But the ERROR message is what we want. 
    // If it says "violates row-level security", we know RLS is hitting.

    const payload = {
        // owner_id: '...?', // We don't have a user ID. 
        // If I omit owner_id, it might fail constraint.
        stock_data_id: stockVehicle.id,
        year: stockVehicle.year ? parseInt(stockVehicle.year) : 2020,
        make: stockVehicle.make,
        model: stockVehicle.model,
        trim: stockVehicle.trim,
        nickname: 'Test Vehicle Script'
    }

    const { data, error } = await supabase
        .from('user_vehicle')
        .insert(payload)
        .select()

    if (error) {
        console.error('Insert user_vehicle FAILED:', error.message)
        console.error('Error details:', error)
    } else {
        console.log('Insert user_vehicle SUCCESS:', data)
    }
}

testVehicleAddition().catch(console.error)
