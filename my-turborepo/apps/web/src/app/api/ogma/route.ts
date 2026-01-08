import { streamText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createClient } from '@/lib/supabase/server';
import { runParliamentEngine } from '@/lib/ogma/parliament-engine';

// Universal Gateway Adapter for final synthesis streaming
const vercelGateway = createOpenAICompatible({
  name: 'ogma-gateway',
  baseURL: 'https://ai-gateway.vercel.sh/v1',
  apiKey: process.env.AI_GATEWAY_API_KEY,
  headers: {
    'x-vercel-ai-provider': 'unified-gateway',
    'x-project-id': 'my-ddpc',
  }
});

export const maxDuration = 300; // Increased for consensus loop (up to 7 rounds)

export async function POST(req: Request) {
  try {
    const { messages, sessionId } = await req.json();
    const supabase = await createClient();

    // Extract the user's prompt from the last message
    const lastMsg = messages[messages.length - 1];
    const userPrompt = typeof lastMsg.content === 'string' 
      ? lastMsg.content 
      : JSON.stringify(lastMsg.content);

    // Log user message
    (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && sessionId) {
            await supabase.from('ogma_chat_messages').insert({
                session_id: sessionId,
                role: 'user',
                content: userPrompt
            });
        }
    })();

    // Run the Parliament Engine (Consensus Loop)
    const { finalResponse, rounds, consensusReached } = await runParliamentEngine(userPrompt, sessionId);

    // Log the deliberation process (optional - for debugging/transparency)
    console.log(`Parliament Engine: ${rounds.length} rounds, Consensus: ${consensusReached}`);

    // Log the final response to database
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && sessionId) {
        await supabase.from('ogma_chat_messages').insert({
          session_id: sessionId,
          role: 'assistant',
          content: finalResponse
        });
      }
    })();

    // Stream the already-synthesized response (no need to re-process)
    // Create a simple readable stream for the final response
    const stream = new ReadableStream({
      start(controller) {
        // Split response into chunks for streaming effect
        const chunks = finalResponse.match(/.{1,50}/g) || [finalResponse];
        let index = 0;
        
        const pushChunk = () => {
          if (index < chunks.length) {
            controller.enqueue(new TextEncoder().encode(chunks[index]));
            index++;
            setTimeout(pushChunk, 10); // Small delay for streaming effect
          } else {
            controller.close();
          }
        };
        
        pushChunk();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('Parliament Engine Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process request through Parliament Engine',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}