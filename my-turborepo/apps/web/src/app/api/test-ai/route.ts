
import { streamText } from 'ai';

// Mock model that implements the LanguageModel interface minimally
const mockModel = {
    specificationVersion: 'v1',
    provider: 'mock',
    modelId: 'mock-model',
    defaultObjectGenerationMode: 'json',
    doStream: async () => ({
        stream: new ReadableStream({
            start(controller) {
                controller.enqueue({ type: 'text-delta', textDelta: 'Hello ' });
                controller.enqueue({ type: 'text-delta', textDelta: 'World' });
                controller.close();
            }
        }),
        rawCall: { rawPrompt: null, rawSettings: {} },
    }),
};

export async function POST() {
    try {
        const result = await streamText({
            model: mockModel as any,
            messages: [{ role: 'user', content: 'hi' }],
        });

        // Check if toDataStreamResponse exists
        if (typeof result.toDataStreamResponse === 'function') {
            return result.toDataStreamResponse();
        }

        // Manual fallback mock
        const textStream = result.textStream;
        const encoder = new TextEncoder();
        const customStream = new ReadableStream({
            async start(controller) {
                for await (const chunk of textStream) {
                    const protocolChunk = `0:${JSON.stringify(chunk)}\n`;
                    controller.enqueue(encoder.encode(protocolChunk));
                }
                controller.close();
            }
        });
        return new Response(customStream);

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
