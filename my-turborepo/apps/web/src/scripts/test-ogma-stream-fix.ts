
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), 'apps/web/.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.warn('Warning: .env.local not found at', envPath);
}

async function testOgmaStream() {
    const endpoint = 'http://localhost:3000/api/ogma';

    console.log('Testing Ogma API endpoint:', endpoint);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'user', content: 'What is in the file package.json? Please read it.' }
                ],
                sessionId: 'test-session-' + Date.now()
            })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        console.log('Content-Type:', response.headers.get('content-type'));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Request failed with status:', response.status);
            console.error('Error details:', errorText);
            return;
        }

        if (!response.body) {
            console.error('No response body');
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        console.log('\n--- Stream Output ---');

        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            process.stdout.write(chunk); // Print raw chunks to see protocol
            buffer += chunk;
        }

        console.log('\n--- End Stream ---');

        // Check for tool call parts (Protocol: 9:...) and text parts (Protocol: 0:...)
        const hasToolCall = buffer.includes('9:{');
        const hasText = buffer.includes('0:"');

        console.log('\nAnalysis:');
        console.log('Contains Tool Call (Part 9):', hasToolCall);
        console.log('Contains Text (Part 0):', hasText);

        if (hasToolCall && hasText) {
            console.log('SUCCESS: Stream contains both tool calls and text response.');
        } else {
            console.log('WARNING: Stream might be missing expected protocol parts.');
        }

    } catch (err) {
        console.error('Test failed:', err);
    }
}

testOgmaStream();
