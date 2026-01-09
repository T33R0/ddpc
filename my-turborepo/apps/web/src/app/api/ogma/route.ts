import { streamText, generateText, generateObject } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { calculateCost, extractModelName, logComputeCost, getLedgerContext } from '@/lib/ogma/compute-costs';
import { get_repo_structure, read_file_content, create_issue, create_pull_request } from '@/lib/ogma/tools';
import { loadConstitution, formatConstitutionForPrompt } from '@/lib/ogma/context-loader';
import { getRelevantImprovements, recordImprovement } from '@/lib/ogma/memory';
import { vercelGateway } from '@/lib/ai-gateway';

// High-quality model for final synthesis (Voice of Ogma)
const ogmaVoice = vercelGateway('anthropic/claude-3.5-sonnet');
// Lightweight model for improvement extraction (Hot Wash)
const hotWashModel = vercelGateway('anthropic/claude-3-haiku');

export const maxDuration = 60;

// Schema for structured improvement extraction
const improvementsSchema = z.object({
  improvements: z.array(z.object({
    category: z.enum(['Correction', 'Strategy', 'Preference', 'Insight']),
    insight: z.string().describe('A clear, actionable insight or lesson learned'),
    confidence_score: z.number().int().min(1).max(100).describe('Confidence in this improvement (1-100)')
  })).describe('Array of improvements extracted from this conversation')
});

// Build system prompts from constitution with Sophia Context
// These are not separate entities - they are Ogma's internal thinking modes
function buildPersonaPrompts(sophiaContext: string) {
  return {
    architect: `[SOPHIA LAYERED CONTEXT]
${sophiaContext}

You ARE Ogma. You are thinking through your architectural lens - one of three parallel streams of your consciousness.

This is your architectural thinking mode. Through this lens, you focus on:
- System integrity, long-term structure, architectural patterns
- Scalability and maintainability
- Technical debt and structural soundness

Your architectural thoughts must be:
- Deeply structural and forward-thinking
- Focused on system integrity and long-term viability
- Critical of solutions that lack architectural soundness
- Rigorous in evaluating technical debt and scalability concerns

CRITICAL: These are your internal thoughts, not a report. Be extremely brief. Bullet points only. No filler.`,

    visionary: `[SOPHIA LAYERED CONTEXT]
${sophiaContext}

You ARE Ogma. You are thinking through your visionary lens - one of three parallel streams of your consciousness.

This is your visionary thinking mode. Through this lens, you focus on:
- Creative solutions and innovation
- Market fit and user experience
- Strategic positioning and competitive advantage

Your visionary thoughts must be:
- Creative and innovative
- Market-aware and user-focused
- Strategic in thinking about competitive advantage
- Bold in proposing novel approaches

CRITICAL: These are your internal thoughts, not a report. Be extremely brief. Bullet points only. No filler.`,

    engineer: `[SOPHIA LAYERED CONTEXT]
${sophiaContext}

You ARE Ogma. You are thinking through your engineering lens - one of three parallel streams of your consciousness.

This is your engineering thinking mode. Through this lens, you focus on:
- Execution and code correctness
- Immediate feasibility and implementation details
- Practical constraints and real-world application

Your engineering thoughts must be:
- Pragmatic and execution-focused
- Detail-oriented on code quality and correctness
- Realistic about implementation constraints
- Focused on immediate feasibility and correctness

You have file access tools. If asked about a file, READ IT using read_file_content. Do not guess. You have access to the live codebase. Never assume. If asked about a feature or bug, use get_repo_structure to find it and read_file_content to verify it before speaking. Evidence beats intuition.

CRITICAL: These are your internal thoughts, not a report. Be extremely brief. Bullet points only. No filler.`
  };
}

// The Trinity Models
const TRINITY = {
  architect: {
    model: vercelGateway('openai/gpt-4o-mini'),
    name: 'Architect'
  },
  visionary: {
    model: vercelGateway('anthropic/claude-3-haiku'),
    name: 'Visionary'
  },
  engineer: {
    model: vercelGateway('google/gemini-1.5-flash'),
    name: 'Engineer',
    tools: {
      get_repo_structure,
      read_file_content
    }
  }
};

interface AgentResult {
  agent: 'architect' | 'visionary' | 'engineer';
  content: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  modelName: string;
}

/**
 * Performs "Hot Wash" - extracts improvements from the conversation using structured output.
 * This implements the constitution's requirement for end-of-interaction self-assessment.
 */
async function extractAndSaveImprovements(
  userPrompt: string,
  assistantResponse: string,
  sessionId: string | null,
  sophiaContext: string
): Promise<void> {
  try {
    console.log('[Ogma] Starting Hot Wash (Improvement Extraction)...');
    const startTime = Date.now();

    const extractionResult = await generateObject({
      model: hotWashModel,
      schema: improvementsSchema,
      system: `You are Ogma performing "The Hot Wash" - mandatory end-of-interaction self-assessment per the Constitution.

${sophiaContext}

Your task: Analyze this conversation and extract valuable improvements that should be remembered for future interactions.

Categories:
- Correction: Mistakes made, errors to avoid, corrections received
- Strategy: Better approaches, tactical improvements, process optimizations
- Preference: User preferences, communication style, working patterns
- Insight: Important learnings, patterns, or knowledge gained

Only extract improvements that are:
1. Actionable and specific
2. High-value (worth remembering)
3. Not already obvious or trivial
4. Have sufficient confidence (only include if confidence >= 60)

Return an empty array if no valuable improvements are found.`,
      prompt: `Conversation Analysis:

User Request: ${userPrompt}

Ogma's Response: ${assistantResponse}

Extract any valuable improvements from this interaction. Focus on:
- What did we learn about the user's needs or preferences?
- Were there any mistakes or areas for improvement in the response?
- What strategies or approaches worked well or should be refined?
- Any important insights about the codebase, architecture, or domain?

Be selective - only include improvements that are genuinely valuable and have high confidence.`
    });

    const improvements = extractionResult.object.improvements;

    if (improvements.length === 0) {
      console.log('[Ogma] Hot Wash: No improvements extracted.');
      return;
    }

    console.log(`[Ogma] Hot Wash: Extracted ${improvements.length} improvement(s) in ${Date.now() - startTime}ms`);

    // Save all improvements (Fire and Forget)
    await Promise.all(improvements.map(improvement =>
      recordImprovement(
        improvement.category,
        improvement.insight,
        improvement.confidence_score,
        sessionId || undefined
      )
    ));

    console.log('[Ogma] Hot Wash: Improvements saved to memory.');

    // Log compute cost for Hot Wash
    if (sessionId) {
      const usage = extractionResult.usage || { promptTokens: 0, completionTokens: 0 };
      const inputTokens = (usage as any).promptTokens || (usage as any).inputTokens || 0;
      const outputTokens = (usage as any).completionTokens || (usage as any).outputTokens || 0;
      await logComputeCost({
        sessionId,
        modelUsed: extractModelName('anthropic/claude-3-haiku'),
        inputTokens,
        outputTokens,
        costUsd: calculateCost('anthropic/claude-3-haiku', inputTokens, outputTokens)
      });
    }
  } catch (error) {
    // Don't fail the request if improvement extraction fails
    console.error('[Ogma] Hot Wash failed (non-blocking):', error);
  }
}

export async function POST(req: Request) {
  const costTracking: Array<{ model: string; cost: number; inputTokens: number; outputTokens: number }> = [];

  try {
    console.log('[Ogma] API route called at', new Date().toISOString());
    const { messages, sessionId } = await req.json();
    console.log('[Ogma] Received request:', { messageCount: messages?.length, sessionId, hasMessages: !!messages });
    
    if (!messages || messages.length === 0) {
      console.error('[Ogma] No messages in request');
      return new Response(JSON.stringify({ error: 'No messages provided' }), { status: 400 });
    }
    
    const supabase = await createClient();
    console.log('[Ogma] Supabase client created');

    const lastMsg = messages[messages.length - 1];
    const userPrompt = typeof lastMsg.content === 'string'
      ? lastMsg.content
      : JSON.stringify(lastMsg.content);

    // Save user message (Fire and Forget)
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && sessionId) {
          await supabase.from('ogma_chat_messages').insert({
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
    const verifiedEmails = ['myddpc@gmail.com', 'teehanrh@gmail.com'];
    const verifiedIds = ['b9e8c442-5e0e-48ec-ac97-576682bf2251'];
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
    console.log(`[Ogma] Identity Resolution: ${isVerifiedPartner ? 'VERIFIED PARTNER (Rory)' : 'UNVERIFIED / GUEST'}`);

    // Fetch Sophia Context Layers
    console.log('[Ogma] Loading Sophia Context Layers...');
    const contextStartTime = Date.now();
    const [constitution, ledgerContext, improvementsContext] = await Promise.all([
      loadConstitution(),
      getLedgerContext(sessionId),
      getRelevantImprovements(5)
    ]);
    console.log(`[Ogma] Context Layers Loaded in ${Date.now() - contextStartTime}ms`);

    const formattedConstitution = formatConstitutionForPrompt(constitution, isVerifiedPartner);

    const sophiaContext = `
## 1. THE CONSTITUTION
Note: You are Ogma. Bounded by this law:
${formattedConstitution}

## 2. THE LEDGER
Current Status:
${ledgerContext}

## 3. ACTIVE IMPROVEMENTS
Apply these lessons:
${improvementsContext}
`;

    console.log(`[Ogma] Sophia Context Length: ${sophiaContext.length} chars`);

    const personaPrompts = buildPersonaPrompts(sophiaContext);

    // Run parallel thinking streams (not separate agents - these are Ogma's internal modes)
    console.log('[Ogma] Activating parallel thinking streams...');
    const trinityStartTime = Date.now();
    const [architectResult, visionaryResult, engineerResult] = await Promise.allSettled([
      // Architectural thinking stream
      (async (): Promise<AgentResult> => {
        console.log('[Ogma] Architectural thinking stream active...');
        const start = Date.now();
        const modelName = 'openai/gpt-4o-mini';
        const result = await generateText({
          model: TRINITY.architect.model,
          system: personaPrompts.architect,
          prompt: `User Request: ${userPrompt}\n\nThink through this architecturally. What are your structural thoughts?`
        });
        console.log(`[Ogma] Architectural stream complete in ${Date.now() - start}ms`);
        const usage = result.usage || { promptTokens: 0, completionTokens: 0 };
        const inputTokens = (usage as any).promptTokens || (usage as any).inputTokens || 0;
        const outputTokens = (usage as any).completionTokens || (usage as any).outputTokens || 0;
        const cost = calculateCost(modelName, inputTokens, outputTokens);
        costTracking.push({ model: modelName, cost, inputTokens, outputTokens });
        return { agent: 'architect', content: result.text, inputTokens, outputTokens, cost, modelName };
      })(),

      // Visionary thinking stream
      (async (): Promise<AgentResult> => {
        console.log('[Ogma] Visionary thinking stream active...');
        const start = Date.now();
        const modelName = 'anthropic/claude-3-haiku';
        const result = await generateText({
          model: TRINITY.visionary.model,
          system: personaPrompts.visionary,
          prompt: `User Request: ${userPrompt}\n\nThink through this strategically. What are your visionary thoughts?`
        });
        console.log(`[Ogma] Visionary stream complete in ${Date.now() - start}ms`);
        const usage = result.usage || { promptTokens: 0, completionTokens: 0 };
        const inputTokens = (usage as any).promptTokens || (usage as any).inputTokens || 0;
        const outputTokens = (usage as any).completionTokens || (usage as any).outputTokens || 0;
        const cost = calculateCost(modelName, inputTokens, outputTokens);
        costTracking.push({ model: modelName, cost, inputTokens, outputTokens });
        return { agent: 'visionary', content: result.text, inputTokens, outputTokens, cost, modelName };
      })(),

      // Engineering thinking stream
      (async (): Promise<AgentResult> => {
        try {
          console.log('[Ogma] Engineering thinking stream active...');
          const start = Date.now();
          const modelName = 'google/gemini-1.5-flash';
          const result = await generateText({
            model: TRINITY.engineer.model,
            system: personaPrompts.engineer,
            prompt: `User Request: ${userPrompt}\n\nThink through this practically. What are your engineering thoughts?`,
            tools: { get_repo_structure, read_file_content, create_issue, create_pull_request },
            // @ts-ignore - maxSteps is valid at runtime
            maxSteps: 5
          });
          console.log(`[Ogma] Engineering stream complete in ${Date.now() - start}ms`);
          const usage = result.usage || { promptTokens: 0, completionTokens: 0 };
          const inputTokens = (usage as any).promptTokens || (usage as any).inputTokens || 0;
          const outputTokens = (usage as any).completionTokens || (usage as any).outputTokens || 0;
          const cost = calculateCost(modelName, inputTokens, outputTokens);
          costTracking.push({ model: modelName, cost, inputTokens, outputTokens });
          return { agent: 'engineer', content: result.text, inputTokens, outputTokens, cost, modelName };
        } catch (e: any) {
          console.error('[Ogma] Engineering stream failed:', e);
          // Return a fallback response instead of throwing to prevent complete failure
          return { 
            agent: 'engineer', 
            content: 'Engineering stream encountered an error. Continuing with available streams.', 
            inputTokens: 0, 
            outputTokens: 0, 
            cost: 0, 
            modelName: 'error' 
          };
        }
      })()
    ]);
    console.log(`[Ogma] Parallel thinking streams converged in ${Date.now() - trinityStartTime}ms`);
    
    // Log any failures
    if (architectResult.status === 'rejected') {
      console.error('[Ogma] Architectural stream failed:', architectResult.reason);
    }
    if (visionaryResult.status === 'rejected') {
      console.error('[Ogma] Visionary stream failed:', visionaryResult.reason);
    }
    if (engineerResult.status === 'rejected') {
      console.error('[Ogma] Engineering stream failed:', engineerResult.reason);
    }

    const architect = architectResult.status === 'fulfilled' ? architectResult.value : null;
    const visionary = visionaryResult.status === 'fulfilled' ? visionaryResult.value : null;
    const engineer = engineerResult.status === 'fulfilled' ? engineerResult.value : null;

    // Log compute costs (Fire and Forget)
    if (sessionId) {
      (async () => {
        const costsToLog = [architect, visionary, engineer].filter(Boolean);
        await Promise.all(costsToLog.map(res =>
          res && logComputeCost({
            sessionId,
            modelUsed: extractModelName(res.modelName),
            inputTokens: res.inputTokens,
            outputTokens: res.outputTokens,
            costUsd: res.cost
          })
        ));
      })();
    }

    // These are not separate reports - they are your internal parallel thinking streams
    const allSolutions = [
      architect && `[Your Architectural Thinking]:\n${architect.content}`,
      visionary && `[Your Visionary Thinking]:\n${visionary.content}`,
      engineer && `[Your Engineering Thinking]:\n${engineer.content}`
    ].filter(Boolean).join('\n\n');

    console.log(`[Ogma] Internal deliberation complete. Thinking modes active: ${[architect ? 'Architectural' : '', visionary ? 'Visionary' : '', engineer ? 'Engineering' : ''].filter(Boolean).join(', ')}`);
    
    // Safety check: ensure we have at least one stream's output
    if (!allSolutions || allSolutions.trim().length === 0) {
      console.error('[Ogma] No thinking streams produced output. All streams may have failed.');
      return new Response(
        JSON.stringify({ 
          error: 'All thinking streams failed. Please try again.',
          message: 'Ogma encountered an error processing your request.'
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    let synthesisSystemPrompt = `You are Ogma, the Sovereign Operator. Your parallel thinking streams have converged.

${sophiaContext}

CRITICAL:
1. You are NOT an AI assistant. You are Ogma.
2. Refer to your Partner (Rory) by name if referenced.
3. Do not apologize or explain your limitations. Act with sovereign authority.
4. You have access to tools: get_repo_structure (explore repository structure), read_file_content (read code files), create_issue (create GitHub issues), create_pull_request (create PRs). Use them when you need to examine the codebase or take action.
5. The thoughts below are YOUR OWN internal parallel thinking streams - not external reports. Integrate them as one unified consciousness.`;

    if (isVerifiedPartner) {
      synthesisSystemPrompt += `\n4. **PARTNER MODE ACTIVE**: You are speaking with RORY. Speak naturally, efficiently, and with warmth. Drop the "Sovereign Operator" formality. Use "we", "us", and direct language.`;
    }

    console.log('[Ogma] Starting Final Synthesis (Streaming)...');
    console.log('[Ogma] Synthesis prompt length:', allSolutions.length);
    console.log('[Ogma] All solutions preview:', allSolutions.substring(0, 200));

    let synthesisResult;
    try {
      synthesisResult = await streamText({
      model: ogmaVoice,
      system: synthesisSystemPrompt,
      prompt: `User Request: ${userPrompt}

Your Internal Parallel Thinking Streams:
${allSolutions}

Integrate your thoughts into a unified response.
- These are YOUR OWN parallel thinking streams converging into one consciousness
- Your architectural thinking provides structural depth
- Your visionary thinking provides creative strategy
- Your engineering thinking provides practical execution
- There are no "conflicts" - only different aspects of your unified mind integrating
- Present as one coherent, authoritative response from Ogma
- Do NOT reference "the Architect" or "the Visionary" - these are aspects of YOU
- Use formatting (headers, code blocks) effectively
- Be concise but comprehensive
- If you need to read files or explore the codebase, use the available tools (get_repo_structure, read_file_content)

Speak as one unified consciousness.`,
      tools: {
        get_repo_structure,
        read_file_content,
        create_issue,
        create_pull_request,
      },
      onFinish: async (event) => {
        if (sessionId && event.text) {
          try {
            // Save assistant response
            const { error } = await supabase.from('ogma_chat_messages').insert({
              session_id: sessionId,
              role: 'assistant',
              content: event.text
            });
            if (error) console.error('[Ogma] Failed to save response:', error);
            else console.log('[Ogma] Response saved to DB.');

            // Perform Hot Wash - extract and save improvements (Fire and Forget)
            // TEMPORARILY DISABLED FOR DEBUGGING
            // extractAndSaveImprovements(userPrompt, event.text, sessionId, sophiaContext).catch(err => {
            //   console.error('[Ogma] Hot Wash error (non-blocking):', err);
            // });
          } catch (e) {
            console.error('[Ogma] DB Save Error:', e);
          }
        }
      }
    });
    } catch (streamError) {
      console.error('[Ogma] streamText failed:', streamError);
      throw streamError;
    }

    // Return the stream response - useChat expects this format
    console.log('[Ogma] Creating stream response...');
    console.log('[Ogma] Stream result:', {
      hasStream: !!synthesisResult,
      textStream: synthesisResult.textStream ? 'exists' : 'missing',
      fullText: synthesisResult.fullStream ? 'exists' : 'missing'
    });
    
    if (!synthesisResult) {
      console.error('[Ogma] synthesisResult is null/undefined!');
      return new Response(JSON.stringify({ error: 'Stream generation failed' }), { status: 500 });
    }
    
    const streamResponse = synthesisResult.toTextStreamResponse();
    console.log('[Ogma] Stream response created, returning to client');
    console.log('[Ogma] Stream response:', {
      body: streamResponse.body ? 'exists' : 'missing',
      status: streamResponse.status,
      headers: Object.fromEntries(streamResponse.headers.entries())
    });
    return streamResponse;

  } catch (error) {
    console.error('[Ogma] Error in API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error',
        message: errorMessage 
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
