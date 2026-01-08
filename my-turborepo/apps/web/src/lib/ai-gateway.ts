
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// Universal Gateway Adapter
export const vercelGateway = createOpenAICompatible({
    name: 'ogma-gateway',
    baseURL: 'https://ai-gateway.vercel.sh/v1',
    apiKey: process.env.AI_GATEWAY_API_KEY,
    headers: {
        'x-vercel-ai-provider': 'unified-gateway',
        'x-project-id': 'my-ddpc',
    }
});
