import { streamText, convertToModelMessages, createDataStreamResponse } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

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
    color: "blue"
  },
  visionary: {
    model: vercelGateway('anthropic/claude-3.7-sonnet'),
    role: "You are The Visionary. Focus on creative solutions and lateral thinking.",
    color: "purple"
  },
  engineer: {
    model: vercelGateway('google/gemini-2.5-pro'),
    role: "You are The Engineer. Focus on code correctness and execution.",
    color: "green"
  }
};

export const maxDuration = 60;

export async function POST(req: Request) {
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

  // 3. Create a Custom Data Stream (v6 Standard)
  return createDataStreamResponse({
    execute: async (dataStream) => {
      // v6: Use convertToModelMessages (Async)
      const modelMessages = await convertToModelMessages(messages);
      
      // We need generateText to capture the full thought string
      const { generateText } = await import('ai');

      const runAgent = async (key: 'architect' | 'visionary' | 'engineer') => {
        const agent = TRINITY[key];
        
        const { text } = await generateText({
          model: agent.model,
          system: agent.role,
          messages: modelMessages,
        });

        // v6: Write annotation to the stream manually
        dataStream.writeMessageAnnotation({
          type: 'thought',
          agent: key,
          color: agent.color,
          content: text
        });

        return text;
      };

      // Run Trinity in Parallel
      const [archText, visText, engText] = await Promise.all([
        runAgent('architect'),
        runAgent('visionary'),
        runAgent('engineer')
      ]);

      const synthesisPrompt = `
      Internal Perspectives:
      [ARCHITECT]: ${archText}
      [VISIONARY]: ${visText}
      [ENGINEER]: ${engText}
      
      Synthesize these into a single cohesive response. Speak as Ogma.
      `;

      // Stream Ogma's Final Word
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

      // Merge Ogma's stream into our custom data stream
      result.mergeIntoDataStream(dataStream);
    },
  });
}