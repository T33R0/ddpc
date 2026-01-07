import { generateText, streamText, convertToCoreMessages } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createClient } from '@/lib/supabase/server';

// 1. Universal Gateway Adapter
// Forces traffic through Vercel Gateway (Marketplace Mode)
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

    // --- Database Logging (User Message) ---
    const { data: { user } } = await supabase.auth.getUser();

    if (user && sessionId) {
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

      await supabase.from('ogma_chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);
    }

    // --- The Trinity Logic ---
    
    // STANDARD FIX: Now that dependencies are clean, we use the standard helper.
    // This converts frontend messages to the Core format 'streamText' expects.
    const coreMessages = convertToCoreMessages(messages);

    // Extract latest prompt for the synthesis context
    const lastMsgContent = coreMessages[coreMessages.length - 1]?.content ?? '';
    const latestPromptText = typeof lastMsgContent === 'string'
      ? lastMsgContent
      : Array.isArray(lastMsgContent)
        ? lastMsgContent.filter(part => part.type === 'text').map(p => p.text).join('')
        : '';

    // Parallel Execution
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

    // Synthesize
    const synthesisPrompt = `
    You are Ogma.
    The user asked: "${latestPromptText}"

    Internal Perspectives:
    [ARCHITECT]: ${architectRes.text}
    [VISIONARY]: ${visionaryRes.text}
    [ENGINEER]: ${engineerRes.text}
    
    Synthesize these into a single cohesive response. Speak as Ogma.
    `;

    // --- Final Stream ---
    const result = streamText({
      model: vercelGateway('openai/gpt-5'),
      prompt: synthesisPrompt,
      onFinish: async ({ text }) => {
        if (user && sessionId) {
          await supabase.from('ogma_chat_messages').insert({
            session_id: sessionId,
            role: 'assistant',
            content: text
          });
        }
      }
    });

    // Return Data Stream Protocol
    return result.toDataStreamResponse();

  } catch (error) {
    console.error('Ogma Trinity Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process Trinity request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}