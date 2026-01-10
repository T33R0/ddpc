
import * as ai from 'ai';

console.log('AI Package Keys:', Object.keys(ai));
console.log('streamText type:', typeof ai.streamText);
console.log('generateText type:', typeof ai.generateText);
console.log('toDataStreamResponse type:', typeof (ai as any).toDataStreamResponse);
try {
    const result = await ai.streamText({
        model: { provider: 'mock', modelId: 'mock' } as any, // Mock model unlikely to work but should return object
        messages: [{ role: 'user', content: 'test' }]
    });
    console.log('streamText result keys:', Object.keys(result));
} catch (e) {
    console.log('streamText mock call failed (expected):', e.message);
}
