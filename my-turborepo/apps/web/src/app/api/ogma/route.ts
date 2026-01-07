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

// 2. Define The Trinity with colors for client rendering
const TRINITY = {
  architect: {
    model: vercelGateway('openai/gpt-5'),
    role: "You are The Architect. Analyze structural integrity and system design.",
    color: "#3b82f6"
  },
  visionary: {
    model: vercelGateway('anthropic/claude-3.7-sonnet'),
    role: "You are The Visionary. Focus on creative solutions and lateral thinking.",
    color: "#a855f7"
  },
  engineer: {
    model: vercelGateway('google/gemini-2.5-pro'),
    role: "You are The Engineer. Focus on code correctness and execution.",
    color: "#10b981"
  }
};

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, sessionId } = await req.json();
  const supabase = await createClient();

  // Log user message (fire and forget)
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

  // Convert messages for AI SDK
  const modelMessages = await convertToModelMessages(messages);
  
  // Run all Trinity agents in parallel to collect their thoughts
  const [archResult, visResult, engResult] = await Promise.all([
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

  const archText = archResult.text;
  const visText = visResult.text;
  const engText = engResult.text;

  // Synthesize final response with Trinity thoughts as context
  const synthesisPrompt = `Internal Perspectives:
[ARCHITECT]: ${archText}
[VISIONARY]: ${visText}
[ENGINEER]: ${engText}

Synthesize these into a single cohesive response. Speak as Ogma.`;

  // Stream final response
  const result = streamText({
    model: vercelGateway('openai/gpt-5'),
    prompt: synthesisPrompt,
    onFinish: async ({ text }) => {
      // Log assistant response (fire and forget)
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

  // Add annotations to the result (Trinity thoughts)
  result.annotations = [
    {
      type: 'thought',
      agent: 'architect',
      color: TRINITY.architect.color,
      content: archText
    },
    {
      type: 'thought',
      agent: 'visionary',
      color: TRINITY.visionary.color,
      content: visText
    },
    {
      type: 'thought',
      agent: 'engineer',
      color: TRINITY.engineer.color,
      content: engText
    }
  ];

  return result.toTextStreamResponse();
}