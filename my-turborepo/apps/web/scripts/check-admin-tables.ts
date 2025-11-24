import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), 'apps/web/.env.local')
console.log(`Loading env from: ${envPath}`)

if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath })
    if (result.error) {
        console.error('Error loading .env file:', result.error)
    }
} else {
    console.error('Env file not found at:', envPath)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log(`URL: ${supabaseUrl ? 'Set' : 'Missing'}`)
console.log(`Service Key: ${supabaseServiceKey ? 'Set' : 'Missing'}`)

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAdminTables() {
    console.log('Checking issue_reports table...')
    const { data, error, count } = await supabase
        .from('issue_reports')
        .select('*', { count: 'exact', head: true })

    if (error) {
        console.error('Error accessing issue_reports:', error.message)
    } else {
        console.log(`Success! Found ${count} records in issue_reports.`)
    }
}

checkAdminTables().catch(console.error)
