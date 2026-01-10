
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), 'apps/web/.env.local');
console.log('Loading env from:', envPath);

if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf-8');
    console.log('Raw file first 200 chars:', raw.substring(0, 200).replace(/\n/g, '\\n'));

    const envConfig = dotenv.parse(raw);
    console.log('Parsed keys:', Object.keys(envConfig));

    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} else {
    console.error('.env.local not found');
    process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL:', url ? 'Present' : 'Missing');
console.log('Key:', key ? 'Present' : 'Missing'); // Don't log full key

if (!url || !key) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

try {
    const supabase = createClient(url, key);
    console.log('Supabase client initialized successfully.');
} catch (error) {
    console.error('Failed to initialize Supabase client:', error);
}
