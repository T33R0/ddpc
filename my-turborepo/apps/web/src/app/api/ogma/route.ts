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

    // Log user message - await properly to ensure it's saved
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && sessionId) {
        const { error } = await supabase.from('ogma_chat_messages').insert({
          session_id: sessionId,
          role: 'user',
          content: userPrompt
        });
        if (error) {
          console.error('Failed to save user message:', error);
        }
      }
    } catch (err) {
      console.error('Error saving user message:', err);
    }

    // Run Parliament Engine to get the response
    // Progress is logged to console but UI will show status via loading state
    const { finalResponse, rounds, consensusReached } = await runParliamentEngine(
      userPrompt, 
      sessionId,
      (progress) => {
        // Log progress for debugging
        console.log('Parliament Engine Progress:', progress);
      }
    );

    // Log the deliberation process
    console.log(`Parliament Engine: ${rounds.length} rounds, Consensus: ${consensusReached}`);

    // Log the final response to database - await properly
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && sessionId) {
        const { error } = await supabase.from('ogma_chat_messages').insert({
          session_id: sessionId,
          role: 'assistant',
          content: finalResponse
        });
        if (error) {
          console.error('Failed to save assistant message:', error);
        }
      }
    } catch (err) {
      console.error('Error saving assistant message:', err);
    }

    // Create a stream using a simple model for the response
    // We'll use streamText with a dummy model to get proper AI SDK streaming format
    const encoder = new TextEncoder();
    
    // Helper to escape JSON string for text chunks
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
          // Stream the final response in chunks for smooth display
          const chunkSize = 20; // Smaller chunks for faster perceived response
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
            
            // Very small delay for streaming effect (faster response)
            if (i < chunks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 5));
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