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

async function testClientFetch() {
    console.log('Testing AddServiceDialog specific query...')

    // 1. Get a service item ID to test with
    const { data: item, error: itemError } = await supabase
        .from('service_items')
        .select('id')
        .limit(1)
        .single()

    if (itemError || !item) {
        console.error('Failed to get a test service item:', itemError)
        return
    }
    const serviceItemId = item.id
    console.log('Testing with Service Item ID:', serviceItemId)

    // 2. Run the exact query from AddServiceDialog
    console.log('Running fetchServiceItemAndCategory query...')
    const { data: fetchedItem, error: fetchError } = await supabase
        .from('service_items')
        .select('id, name, category_id, service_categories!inner(id, name)')
        .eq('id', serviceItemId)
        .single()

    if (fetchError) {
        console.error('Query FAILED:', fetchError.message)
        console.error('Details:', fetchError)
    } else {
        console.log('Query SUCCESS:', fetchedItem)
    }
}

testClientFetch().catch(console.error)
