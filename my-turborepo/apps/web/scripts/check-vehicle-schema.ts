import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

const envPath = path.resolve(process.cwd(), 'apps/web/.env.local')
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function checkSchema() {
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing credentials')
        return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
        .from('vehicle_data')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error fetching vehicle_data:', error)
        return
    }

    if (!data || data.length === 0) {
        console.log('No rows in vehicle_data, cannot infer columns from data.')
        return
    }

    const columns = Object.keys(data[0]).sort()
    console.log('Current vehicle_data columns:', JSON.stringify(columns, null, 2))
}

checkSchema().catch(console.error)
