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
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Anon Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testIssueSubmission() {
    console.log('Starting issue submission test...')
    const startTime = Date.now()

    const payload = {
        page_url: 'http://localhost/test-script',
        description: 'Test submission from diagnostic script',
        user_email: 'test@example.com'
    }

    console.log('Inserting payload:', payload)

    // Set a timeout promise
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout after 10s')), 10000)
    )

    try {
        const insertPromise = supabase
            .from('issue_reports')
            .insert(payload)
            .select()

        const { data, error } = await Promise.race([insertPromise, timeout]) as any

        const duration = Date.now() - startTime
        console.log(`Operation completed in ${duration}ms`)

        if (error) {
            console.error('Insert failed with error:', error)
        } else {
            console.log('Insert successful:', data)

            // Clean up
            if (data && data[0] && data[0].id) {
                console.log('Cleaning up test record...')
                const { error: deleteError } = await supabase
                    .from('issue_reports')
                    .delete()
                    .eq('id', data[0].id)

                if (deleteError) console.error('Cleanup failed:', deleteError)
                else console.log('Cleanup successful')
            }
        }

    } catch (e: any) {
        console.error('Test FAILED:', e.message)
        if (e.message.includes('Timeout')) {
            console.error('!!! THE INSERT OPERATION TIMED OUT !!!')
            console.error('This confirms a database-level lock or trigger issue.')
        }
    }
}

testIssueSubmission().catch(console.error)
