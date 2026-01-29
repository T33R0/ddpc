
import { generateText } from 'ai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

async function testModels() {
    console.log('Testing Model Availability via Ogma Gateway...');

    // Dynamic import
    const { vercelGateway } = await import('../lib/ai-gateway');

    // Test 1: Gemini (Expected to fail)
    try {
        console.log('\n1. Testing google/gemini-1.5-flash (Old Engineer Model)...');
        const gemini = vercelGateway('google/gemini-1.5-flash');
        await generateText({
            model: gemini,
            prompt: 'Ping',
        });
        console.log('Gemini: SUCCESS (Unexpected)');
    } catch (error: any) {
        console.log('Gemini: FAILED (Expected)');
        console.log('Error:', error.message);
    }

    // Test 2: GPT-4o-mini (New Engineer Model)
    try {
        console.log('\n2. Testing openai/gpt-4o-mini (New Engineer Model)...');
        const gpt = vercelGateway('openai/gpt-4o-mini');
        const result = await generateText({
            model: gpt,
            prompt: 'Ping. Reply with "Pong" only.',
        });
        console.log('GPT-4o-mini: SUCCESS');
        console.log('Response:', result.text);
    } catch (error: any) {
        console.log('GPT-4o-mini: FAILED');
        console.error('Error:', error.message);
    }
}

testModels();
