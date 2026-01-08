import { streamText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createClient } from '@/lib/supabase/server';
import { runParliamentEngine } from '@/lib/ogma/parliament-engine';
import { convertToModelMessages } from 'ai';

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

    // Create a proper AI SDK data stream response
    // Format: Each line is either 0:"text" for text deltas or d:{"finishReason":"stop"} for finish
    const encoder = new TextEncoder();
    
    // Helper to escape JSON string
    const escapeJsonString = (str: string): string => {
      return str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
    };
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Split response into chunks for streaming effect (smaller chunks for smoother streaming)
          const chunkSize = 30;
          const chunks: string[] = [];
          
          for (let i = 0; i < finalResponse.length; i += chunkSize) {
            chunks.push(finalResponse.slice(i, i + chunkSize));
          }
          
          if (chunks.length === 0) {
            chunks.push(finalResponse);
          }
          
          // Stream each chunk
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            if (!chunk) continue;
            
            // AI SDK data stream format: 0:"text chunk"
            const escapedChunk = escapeJsonString(chunk);
            const data = `0:"${escapedChunk}"\n`;
            controller.enqueue(encoder.encode(data));
            
            // Small delay for streaming effect (faster to avoid timeout)
            if (i < chunks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 15));
            }
          }
          
          // Send finish signal
          controller.enqueue(encoder.encode('d:{"finishReason":"stop"}\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1',
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