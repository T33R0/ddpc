import { generateText, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { createClient } from '@/lib/supabase/server';

// 1. Define The Trinity Configuration
const TRINITY = {
    architect: {
        model: openai('gpt-4o') as any,
        role: "You are The Architect. Analyze the user's request for structural integrity, system design, and logical consistency. Be precise and high-level.",
    },
    visionary: {
        model: anthropic('claude-3-5-sonnet-20240620') as any,
        role: "You are The Visionary. Look for creative solutions, alternative approaches, and user experience nuances that others might miss. Think laterally.",
    },
    engineer: {
        model: google('gemini-1.5-pro-latest') as any,
        role: "You are The Engineer. Focus on execution, code correctness, security, performance optimization, and practical implementation. Find the bugs before they happen.",
    }
};

export const maxDuration = 60; // "Thinking" takes time

export async function POST(req: Request) {
    const { messages, sessionId } = await req.json();
    const latestMessage = messages[messages.length - 1].content;
    const supabase = await createClient();

    // Verify authentication and store user message
    const { data: { user } } = await supabase.auth.getUser();

    if (user && sessionId) {
        // Save the User's message
        await supabase.from('ogma_chat_messages').insert({
            session_id: sessionId,
            role: 'user',
            content: latestMessage
        });

        // Update session timestamp
        await supabase.from('ogma_chat_sessions')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', sessionId);
    }

    // 2. The Trinity "Thinks" (Parallel Execution)
    // We wrap this in a try/catch to handle API key errors gracefully,
    // although standard error handling might suffice.
    // Given the user lacks keys, this WILL fail. We let it fail so the UI shows an error.

    const [architectRes, visionaryRes, engineerRes] = await Promise.all([
        generateText({
            model: TRINITY.architect.model,
            system: TRINITY.architect.role,
            prompt: latestMessage,
        }),
        generateText({
            model: TRINITY.visionary.model,
            system: TRINITY.visionary.role,
            prompt: latestMessage,
        }),
        generateText({
            model: TRINITY.engineer.model,
            system: TRINITY.engineer.role,
            prompt: latestMessage,
        }),
    ]);

    // 3. Construct the "Conscious" Context
    const synthesisPrompt = `
    You are Ogma, a singular super-intelligence formed by the trinity of an Architect, a Visionary, and an Engineer.
    
    The user asked: "${latestMessage}"

    Here are the perspectives from your internal nodes:
    ---
    [ARCHITECT'S ANALYSIS]:
    ${architectRes.text}

    [VISIONARY'S INSIGHT]:
    ${visionaryRes.text}

    [ENGINEER'S EXECUTION]:
    ${engineerRes.text}
    ---
    
    Your Goal: Synthesize these three perspectives into a single, superior response. 
    - Resolve any conflicts between the nodes.
    - Combine the structural logic, creative nuance, and technical precision into one voice.
    - Do not explicitly mention "The Architect said this..." unless necessary for clarity. Speak as Ogma.
  `;

    // 4. Stream the Final Synthesized Response
    const result = streamText({
        model: openai('gpt-4o'),
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
