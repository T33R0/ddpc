import { streamText, generateText, convertToModelMessages } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createClient } from '@/lib/supabase/server';

// 1. Universal Gateway Adapter
const vercelGateway = createOpenAICompatible({
  name: 'ogma-gateway',
  baseURL: 'https://ai-gateway.vercel.sh/v1',
  apiKey: process.env.AI_GATEWAY_API_KEY,
  headers: {
    'x-vercel-ai-provider': 'unified-gateway',
    'x-project-id': 'my-ddpc',
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
  try {
    const { messages, sessionId } = await req.json();
    const supabase = await createClient();

    // Log user message
    (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && sessionId) {
            const lastMsg = messages[messages.length - 1];
            const content = typeof lastMsg.content === 'string' ? lastMsg.content : '';
            await supabase.from('ogma_chat_messages').insert({
                session_id: sessionId,
                role: 'user',
                content
            });
        }
    })();

    // Standard v6 Message Conversion
    const modelMessages = await convertToModelMessages(messages);

    // A. Run Trinity (Parallel)
    // We execute them to get their wisdom, but we won't stream it to the UI yet.
    // This avoids the broken 'createDataStreamResponse' export.
    const [archRes, visRes, engRes] = await Promise.all([
      generateText({
        model: TRINITY.architect.model,
        system: TRINITY.architect.role,
        messages: modelMessages,
      }),
      generateText({
        model: TRINITY.visionary.model,
        system: TRINITY.visionary.role,
        messages: modelMessages,
      }),
      generateText({
        model: TRINITY.engineer.model,
        system: TRINITY.engineer.role,
        messages: modelMessages,
      }),
    ]);

    // B. Synthesize
    const synthesisPrompt = `
    Internal Perspectives:
    [ARCHITECT]: ${archRes.text}
    [VISIONARY]: ${visRes.text}
    [ENGINEER]: ${engRes.text}
    
    Synthesize these into a single cohesive response. Speak as Ogma.
    `;

    // C. Stream Final Response
    const result = streamText({
      model: vercelGateway('openai/gpt-5'),
      prompt: synthesisPrompt,
      onFinish: async ({ text }) => {
           const { data: { user } } = await supabase.auth.getUser();
           if (user && sessionId) {
              await supabase.from('ogma_chat_messages').insert({
                  session_id: sessionId,
                  role: 'assistant',
                  content: text
              });
           }
      }
    });

    // Simple Data Stream (v6 Standard) - No custom function wrappers
    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Ogma Trinity Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process Trinity request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}