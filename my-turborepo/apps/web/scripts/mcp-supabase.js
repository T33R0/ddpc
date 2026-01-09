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
const supabaseAccessToken = process.env.MCP_SERVER_ACCESS;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Could not find Supabase credentials in .env.local');
    console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) are set.');
    process.exit(1);
}

if (!supabaseAccessToken) {
    console.error('Error: Could not find MCP_SERVER_ACCESS (PAT) in .env.local');
    process.exit(1);
}

// Prepare environment variables for the child process
const env = {
    ...process.env,
    SUPABASE_URL: supabaseUrl,
    SUPABASE_KEY: supabaseKey,
    SUPABASE_ACCESS_TOKEN: supabaseAccessToken,
};

// Resolve the path to the MCP server executable
// It is likely in the root node_modules due to hoisting
const mcpServerPath = path.resolve(__dirname, '../../../node_modules/@supabase/mcp-server-supabase/dist/index.js');

// Spawn the Supabase MCP server using node directly
const mcpProcess = spawn('node', [mcpServerPath], {
    env,
    stdio: 'inherit', // Pipe stdin/stdout/stderr directly
});

mcpProcess.on('error', (err) => {
    console.error('Failed to start Supabase MCP server:', err);
    process.exit(1);
});

mcpProcess.on('exit', (code) => {
    process.exit(code);
});
