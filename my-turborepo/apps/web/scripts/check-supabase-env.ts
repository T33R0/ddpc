import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), 'apps/web/.env.local')
if (fs.existsSync(envPath)) {
    console.log(`Loading environment from ${envPath}`)
    dotenv.config({ path: envPath })
} else {
    console.log('No .env.local file found at', envPath)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('--- Supabase Environment Check ---')
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'Set' : 'MISSING'}`)
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'Set' : 'MISSING'}`)
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? 'Set' : 'MISSING'}`)

async function checkConnection() {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Cannot check connection: Missing URL or Anon Key')
        return
    }

    console.log('\nTesting Anon Client Connection...')
    try {
        const anonClient = createClient(supabaseUrl, supabaseAnonKey)
        const { data, error } = await anonClient.from('vehicle_data').select('count').limit(1).single()

        if (error) {
            console.error('Anon Client Error:', error.message)
        } else {
            console.log('Anon Client Connection Successful!')
        }
    } catch (err) {
        console.error('Anon Client Exception:', err)
    }

    if (supabaseServiceKey) {
        console.log('\nTesting Service Role Client Connection...')
        try {
            const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
            // Try to access a table that might be RLS protected or just general access
            const { data, error } = await serviceClient.from('user_profile').select('count', { count: 'exact', head: true })

            if (error) {
                console.error('Service Role Client Error:', error.message)
            } else {
                console.log('Service Role Client Connection Successful!')
            }
        } catch (err) {
            console.error('Service Role Client Exception:', err)
        }
    } else {
        console.log('\nSkipping Service Role check (Key missing)')
    }
}

checkConnection().catch(console.error)
