
import { streamText, generateText } from 'ai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars from .env.local in the apps/web directory
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Loading env from:', envPath);

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('Env file loaded.');
} else {
    console.error('Env file not found at:', envPath);
}

async function testGateway() {
    console.log('Testing Steward Gateway...');

    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
        console.error('CRITICAL: AI_GATEWAY_API_KEY is missing from environment variables!');
        return;
    }
    console.log('AI_GATEWAY_API_KEY is present (length:', apiKey.length, ')');

    // Dynamic import to ensure env vars are loaded first
    const { vercelGateway } = await import('../lib/ai-gateway');

    try {
        const model = vercelGateway('anthropic/claude-3.5-sonnet');

        console.log('1. Testing generateText...');
        const result = await generateText({
            model,
            prompt: 'Hello, are you working?',
        });
        console.log('GenerateText Result:', result.text);

        console.log('\n2. Testing streamText...');
        const stream = await streamText({
            model,
            prompt: 'Hello, are you streaming?',
        });

        let fullText = '';
        for await (const chunk of stream.textStream) {
            process.stdout.write(chunk);
            fullText += chunk;
        }
        console.log('\nStream complete. Length:', fullText.length);

    } catch (error) {
        console.error('Test failed:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
    }
}

testGateway();
