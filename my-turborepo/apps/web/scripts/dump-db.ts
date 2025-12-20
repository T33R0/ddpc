import { execSync } from 'child_process'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    console.log(`Loading environment from ${envPath}`)
    dotenv.config({ path: envPath })
} else {
    console.log('No .env.local file found at', envPath)
    console.log('Attempting to proceed with existing environment variables...')
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
    console.error('Error: DATABASE_URL is not set in environment or .env.local')
    process.exit(1)
}

const outputPath = path.resolve(process.cwd(), '../../supabase/schema_dump.sql')
const command = `supabase db dump --db-url "${databaseUrl}" > "${outputPath}"`

console.log(`Executing: supabase db dump ... > ${outputPath}`)

try {
    execSync(command, { stdio: 'inherit' })
    console.log('Database dump completed successfully.')
} catch (error) {
    console.error('Error executing database dump:', error)
    process.exit(1)
}
