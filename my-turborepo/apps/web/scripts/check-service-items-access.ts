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

async function checkServiceItemsAccess() {
    console.log('Checking access to service_items and service_categories...')

    // 1. Check service_categories
    const { data: categories, error: catError } = await supabase
        .from('service_categories')
        .select('count')
        .limit(1)
        .single()

    if (catError) {
        console.error('FAILED to read service_categories:', catError.message)
    } else {
        console.log('SUCCESS reading service_categories. Count available.')
    }

    // 2. Check service_items
    const { data: items, error: itemError } = await supabase
        .from('service_items')
        .select('count')
        .limit(1)
        .single()

    if (itemError) {
        console.error('FAILED to read service_items:', itemError.message)
    } else {
        console.log('SUCCESS reading service_items. Count available.')
    }
}

checkServiceItemsAccess().catch(console.error)
