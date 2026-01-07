import { generateText, streamText, convertToModelMessages } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createClient } from '@/lib/supabase/server';

// 1. Universal Gateway Adapter
// Forces all traffic through Vercel's unified key
const vercelGateway = createOpenAICompatible({
    name: 'ogma-gateway',
    baseURL: 'https://ai-gateway.vercel.sh/v1',
    apiKey: process.env.AI_GATEWAY_API_KEY,
    headers: {
        'x-vercel-ai-provider': 'unified-gateway',
        'x-project-id': 'my-ddpc', // Preserving project tagging
    }
});

// 2. Define The Trinity
const TRINITY = {
    architect: {
        model: vercelGateway('openai/gpt-5'),
        role: "You are The Architect. Analyze structural integrity and system design.",
    },
    visionary: {
        model: vercelGateway('anthropic/claude-3.7-sonnet'),
        role: "You are The Visionary. Focus on creative solutions and lateral thinking.",
    },
    engineer: {
        model: vercelGateway('google/gemini-2.5-pro'),
        role: "You are The Engineer. Focus on code correctness and execution.",
    }
};

export const maxDuration = 60;

export async function POST(req: Request) {
    const { messages, sessionId } = await req.json();

    const supabase = await createClient();

    // Verify authentication and store user message
    const { data: { user } } = await supabase.auth.getUser();

    if (user && sessionId) {
        // Save the User's message
        // We need to extract the latest message text for logging
        const latestMessageObj = messages[messages.length - 1];
        const latestContent = typeof latestMessageObj.content === 'string'
            ? latestMessageObj.content
            : Array.isArray(latestMessageObj.content)
                ? latestMessageObj.content.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
                : '';

        await supabase.from('ogma_chat_messages').insert({
            session_id: sessionId,
            role: 'user',
            content: latestContent
        });

        // Update session timestamp
        await supabase.from('ogma_chat_sessions')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', sessionId);
    }

    // FIX: Convert frontend UI messages to standard Core messages
    // This handles the "Object vs String" crash automatically
    const coreMessages = await convertToModelMessages(messages);

    // Helper to get simple text for the synthesis prompt later
    const lastMsgContent = coreMessages[coreMessages.length - 1]?.content ?? '';
    const latestPromptText = typeof lastMsgContent === 'string'
        ? lastMsgContent
        : lastMsgContent.filter(part => part.type === 'text').map(p => p.text).join('');

    // 3. The Trinity Thinks (Parallel Execution)
    // We pass 'messages' instead of 'prompt' so they see the whole history
    const [architectRes, visionaryRes, engineerRes] = await Promise.all([
        generateText({
            model: TRINITY.architect.model,
            system: TRINITY.architect.role,
            messages: coreMessages,
        }),
        generateText({
            model: TRINITY.visionary.model,
            system: TRINITY.visionary.role,
            messages: coreMessages,
        }),
        generateText({
            model: TRINITY.engineer.model,
            system: TRINITY.engineer.role,
            messages: coreMessages,
        }),
    ]);

    // 4. Construct the Synthesis Context
    const synthesisPrompt = `
    You are Ogma.
    The user asked: "${latestPromptText}"

    Internal Perspectives:
    [ARCHITECT]: ${architectRes.text}
    [VISIONARY]: ${visionaryRes.text}
    [ENGINEER]: ${engineerRes.text}
    
    Synthesize these into a single cohesive response. Speak as Ogma.
  `;

    // 5. Stream the Final Response
    // strict usage of vercelGateway to avoid "Missing API Key" errors
    const result = streamText({
        model: vercelGateway('openai/gpt-5'),
        prompt: synthesisPrompt,
        onFinish: async ({ text }) => {
            if (user && sessionId) {
                // Save the Assistant's response
                await supabase.from('ogma_chat_messages').insert({
                    session_id: sessionId,
                    role: 'assistant',
                    content: text
                });
            }
        }
    });

    return result.toTextStreamResponse();
}
