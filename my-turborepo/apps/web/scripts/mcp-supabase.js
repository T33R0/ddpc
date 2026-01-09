import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local in the parent directory (project root)
// Assuming script is in apps/web/scripts/ and .env.local is in apps/web/
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

// Extract Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Could not find Supabase credentials in .env.local');
    console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) are set.');
    process.exit(1);
}

// Prepare environment variables for the child process
const env = {
    ...process.env,
    SUPABASE_URL: supabaseUrl,
    SUPABASE_KEY: supabaseKey,
};

// Spawn the Supabase MCP server
const mcpProcess = spawn('npx', ['-y', '@modelcontextprotocol/server-supabase'], {
    env,
    stdio: 'inherit', // Pipe stdin/stdout/stderr directly
    shell: true,      // Use shell to ensure npx is found
});

mcpProcess.on('error', (err) => {
    console.error('Failed to start Supabase MCP server:', err);
    process.exit(1);
});

mcpProcess.on('exit', (code) => {
    process.exit(code);
});
