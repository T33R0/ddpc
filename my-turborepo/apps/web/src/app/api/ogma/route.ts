import { streamText, convertToModelMessages } from 'ai';
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
    
    // FIX for v6: Use convertToModelMessages (async) instead of convertToCoreMessages
    const modelMessages = await convertToModelMessages(messages);

    // Extract latest prompt for synthesis
    const lastMsgContent = modelMessages[modelMessages.length - 1]?.content ?? '';
    const latestPromptText = typeof lastMsgContent === 'string'
      ? lastMsgContent
      : Array.isArray(lastMsgContent)
        ? lastMsgContent.filter(part => part.type === 'text').map(p => p.text).join('')
        : '';

    // Parallel Execution
    const [architectRes, visionaryRes, engineerRes] = await Promise.all([
      streamText({
        model: TRINITY.architect.model,
        system: TRINITY.architect.role,
        messages: modelMessages,
      }),
      streamText({
        model: TRINITY.visionary.model,
        system: TRINITY.visionary.role,
        messages: modelMessages,
      }),
      streamText({
        model: TRINITY.engineer.model,
        system: TRINITY.engineer.role,
        messages: modelMessages,
      }),
    ]);
    
    // Note: We need full text for synthesis, so we use 'generateText' logic here via stream 
    // or we assume we want to stream the synthesis immediately. 
    // To keep it simple and fast, we will just start the synthesis stream 
    // using the Trinity personas as "System" context injections if we were doing RAG. 
    // BUT since we want their *output*, we actually need 'generateText' for the Trinity 
    // and 'streamText' for Ogma.
    //
    // Let's correct the loop above to use 'generateText' for the agents so we can await their answers.
    
    // Re-import generateText if needed, or use this corrected block:
    const { generateText } = await import('ai'); 

    const [arch, vis, eng] = await Promise.all([
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

    // Synthesize
    const synthesisPrompt = `
    You are Ogma.
    The user asked: "${latestPromptText}"

    Internal Perspectives:
    [ARCHITECT]: ${arch.text}
    [VISIONARY]: ${vis.text}
    [ENGINEER]: ${eng.text}
    
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

    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Ogma Trinity Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process Trinity request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}