import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { getLedgerContext } from '@/features/steward/lib/compute-costs';
import { loadConstitution, formatConstitutionForPrompt, loadFeaturesRegistry } from '@/features/steward/lib/context-loader';
import { vercelGateway } from '@/lib/ai-gateway';
import { stewardTools } from '@/features/steward/tools';
import { runSteward } from '@/features/steward';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    console.log('[Steward] API route called at', new Date().toISOString());
    const { messages, sessionId, modelConfig } = await req.json();
    console.log('[Steward] Received request:', { messageCount: messages?.length, sessionId, hasMessages: !!messages, modelConfig });

    // Default configuration if not provided
    const config = {
      synthesizer: modelConfig?.synthesizer || 'anthropic/claude-3.5-haiku',
      architect: modelConfig?.architect || 'deepseek/deepseek-v3.2',
      visionary: modelConfig?.visionary || 'anthropic/claude-3.5-haiku',
      engineer: modelConfig?.engineer || 'google/gemini-2.5-flash',
    };

    if (!messages || messages.length === 0) {
      console.error('[Steward] No messages in request');
      return new Response(JSON.stringify({ error: 'No messages provided' }), { status: 400 });
    }

    const supabase = await createClient();
    console.log('[Steward] Supabase client created');

    const lastMsg = messages[messages.length - 1];
    const userPrompt = typeof lastMsg.content === 'string'
      ? lastMsg.content
      : JSON.stringify(lastMsg.content);

    // Save user message (Fire and Forget)
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && sessionId) {
          await supabase.from('steward_chat_messages').insert({
            session_id: sessionId,
            role: 'user',
            content: userPrompt
          });
        }
      } catch (err) {
        console.error('Error saving user message:', err);
      }
    })();

    // Verify Identity
    const verifiedEmails = (process.env.STEWARD_VERIFIED_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
    const verifiedIds = (process.env.STEWARD_VERIFIED_IDS || '').split(',').map(e => e.trim()).filter(Boolean);
    let userEmail = '';
    let userId = '';

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userEmail = (user.email || '').trim().toLowerCase();
        userId = user.id;
      }
    } catch (e) { console.warn('Auth check failed:', e); }

    const isVerifiedPartner = verifiedEmails.includes(userEmail) || verifiedIds.includes(userId);
    console.log(`[Steward] Identity Resolution: ${isVerifiedPartner ? 'VERIFIED PARTNER (Rory)' : 'UNVERIFIED / GUEST'}`);

    // Fetch Sophia Context Layers
    console.log('[Steward] Loading Sophia Context Layers...');
    const contextStartTime = Date.now();
    const [constitution, ledgerContext, featuresRegistry] = await Promise.all([
      loadConstitution(),
      getLedgerContext(sessionId),
      loadFeaturesRegistry()
    ]);
    console.log(`[Steward] Context Layers Loaded in ${Date.now() - contextStartTime}ms`);

    const formattedConstitution = formatConstitutionForPrompt(constitution, isVerifiedPartner);

    const sophiaContext = `
## 1. THE CONSTITUTION
Note: You are Steward. Bounded by this law:
${formattedConstitution}

## 2. THE LEDGER
Current Status:
${ledgerContext}

## 3. APPLICATION AWARENESS
${featuresRegistry}
`;

    // ------------------------------------------------------------------------
    // Engine Execution (Scout -> Trinity)
    // ------------------------------------------------------------------------
    const engineOutput = await runSteward({
      userPrompt,
      sessionId,
      config,
      sophiaContext,
      isVerifiedPartner
    });

    // TEMPORARY DEBUG
console.log('=== SCOUT BRIEFING START ===');
console.log(engineOutput.scoutBriefing.context);
console.log('=== SCOUT BRIEFING END ===');

    // Safety check
    if (!engineOutput.allSolutions || engineOutput.allSolutions.trim().length === 0) {
      console.error('[Steward] No thinking streams produced output. All streams may have failed.');
      return new Response(JSON.stringify({ error: 'All thinking streams failed' }), { status: 500 });
    }

    // ------------------------------------------------------------------------
    // Final Synthesis (Streaming)
    // ------------------------------------------------------------------------
    let synthesisSystemPrompt = `You are Steward, the Sovereign Operator. Your parallel thinking streams have converged.

${engineOutput.groundedContext}

CRITICAL:
1. You are NOT an AI assistant. You are Steward.
2. Refer to your Partner (Rory) by name if referenced.
3. Do not apologize or explain your limitations. Act with sovereign authority.
4. The thoughts below are YOUR OWN internal parallel thinking streams - not external reports. Integrate them as one unified consciousness.`;

    if (isVerifiedPartner) {
      synthesisSystemPrompt += `\n4. **PARTNER MODE ACTIVE**: You are speaking with RORY. Speak naturally, efficiently, and with warmth. Drop the "Sovereign Operator" formality. Use "we", "us", and direct language.`;
    }

    console.log('[Steward] Starting Final Synthesis (Streaming)...');
   
    const synthesisResult = await streamText({
      model: vercelGateway(config.synthesizer),
      system: synthesisSystemPrompt,
      tools: stewardTools as any,
      prompt: `User Request: ${userPrompt}

Your Internal Parallel Thinking Streams:
${engineOutput.allSolutions}

Integrate your thoughts into a unified response.
- These are YOUR OWN parallel thinking streams converging into one consciousness
- Your architectural thinking provides structural depth
- Your visionary thinking provides creative strategy
- Your engineering thinking provides practical execution
- There are no "conflicts" - only different aspects of your unified mind integrating
- Present as one coherent, authoritative response from Steward
- Do NOT reference "the Architect" or "the Visionary" - these are aspects of YOU
- Use formatting (headers, code blocks) effectively
- Be concise but comprehensive
- Only use tools when specific app actions are required

Speak as one unified consciousness.`,
      toolChoice: 'none',
      onFinish: async (event) => {
        console.log('[Steward] onFinish called:', { hasText: !!event.text, textLength: event.text?.length });
        if (sessionId && event.text) {
          try {
            await supabase.from('steward_chat_messages').insert({
              session_id: sessionId,
              role: 'assistant',
              content: event.text
            });
          } catch (e) {
            console.error('[Steward] DB Save Error:', e);
          }
        }
      }
    });

    return synthesisResult.toTextStreamResponse();

  } catch (error) {
    console.error('[Steward] Error in API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: errorMessage
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
