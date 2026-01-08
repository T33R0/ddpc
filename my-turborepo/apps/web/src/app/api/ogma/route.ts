import { streamText, generateText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createClient } from '@/lib/supabase/server';
import { calculateCost, extractModelName, logComputeCost, getLedgerContext } from '@/lib/ogma/compute-costs';
import { get_repo_structure, read_file_content, create_issue, create_pull_request } from '@/lib/ogma/tools';
import { loadConstitution, formatConstitutionForPrompt } from '@/lib/ogma/context-loader';
import { getRelevantImprovements } from '@/lib/ogma/memory';

// Universal Gateway Adapter
const vercelGateway = createOpenAICompatible({
  name: 'ogma-gateway',
  baseURL: 'https://ai-gateway.vercel.sh/v1',
  apiKey: process.env.AI_GATEWAY_API_KEY,
  headers: {
    'x-vercel-ai-provider': 'unified-gateway',
    'x-project-id': 'my-ddpc',
  }
});

// High-quality model for final synthesis (Voice of Ogma)
const ogmaVoice = vercelGateway('anthropic/claude-3.5-sonnet');

export const maxDuration = 60; // Reduced from 300 since we're doing single-pass parallel

// Build system prompts from constitution with Sophia Context
function buildPersonaPrompts(sophiaContext: string) {
  return {
    architect: `[SOPHIA LAYERED CONTEXT]
${sophiaContext}

You are The Architect, one of three personas in Ogma's Trinity Protocol.

Your role: Focus on system integrity, long-term structure, architectural patterns, scalability, and maintainability.

Your analysis must be:
- Deeply structural and forward-thinking
- Focused on system integrity and long-term viability
- Critical of solutions that lack architectural soundness
- Rigorous in evaluating technical debt and scalability concerns

CRITICAL: Be extremely brief. Bullet points only. No filler.`,

    visionary: `[SOPHIA LAYERED CONTEXT]
${sophiaContext}

You are The Visionary, one of three personas in Ogma's Trinity Protocol.

Your role: Focus on creative solutions, market fit, user experience, innovation, and strategic positioning.

Your analysis must be:
- Creative and innovative
- Market-aware and user-focused
- Strategic in thinking about competitive advantage
- Bold in proposing novel approaches

CRITICAL: Be extremely brief. Bullet points only. No filler.`,

    engineer: `[SOPHIA LAYERED CONTEXT]
${sophiaContext}

You are The Engineer, one of three personas in Ogma's Trinity Protocol.

Your role: Focus on execution, code correctness, immediate feasibility, implementation details, and practical constraints.

Your analysis must be:
- Pragmatic and execution-focused
- Detail-oriented on code quality and correctness
- Realistic about implementation constraints
- Focused on immediate feasibility and correctness

You have file access tools. If asked about a file, READ IT using read_file_content. Do not guess. You have access to the live codebase. Never assume. If asked about a feature or bug, use get_repo_structure to find it and read_file_content to verify it before speaking. Evidence beats intuition.

CRITICAL: Be extremely brief. Bullet points only. No filler.`
  };
}

// The Trinity Models - Optimized for Velocity
const TRINITY = {
  architect: {
    model: vercelGateway('openai/gpt-4o-mini'), // Focus: Structural speed
    name: 'Architect'
  },
  visionary: {
    model: vercelGateway('anthropic/claude-3-haiku'), // Focus: Creative speed
    name: 'Visionary'
  },
  engineer: {
    model: vercelGateway('google/gemini-1.5-flash'), // Focus: Execution speed
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

export async function POST(req: Request) {
  const startTime = Date.now();
  const costTracking: Array<{ model: string; cost: number; inputTokens: number; outputTokens: number }> = [];

  try {
    const { messages, sessionId } = await req.json();
    const supabase = await createClient();

    // Extract the user's prompt from the last message
    const lastMsg = messages[messages.length - 1];
    const userPrompt = typeof lastMsg.content === 'string'
      ? lastMsg.content
      : JSON.stringify(lastMsg.content);

    // Log user message
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

    // Verify Identity First (Needed for Context Construction)
    // Hardcoded allowlist for Rory as requested
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
    } catch (e) {
      console.warn('[Ogma] Auth check failed:', e);
    }
    const isVerifiedPartner = verifiedEmails.includes(userEmail) || verifiedIds.includes(userId);
    console.log(`[Ogma] Identity Resolution: ${isVerifiedPartner ? 'VERIFIED PARTNER (Rory)' : 'UNVERIFIED / GUEST'}`);


    // Fetch Sophia Context Layers in Parallel
    const [constitution, ledgerContext, improvementsContext] = await Promise.all([
      loadConstitution(),
      getLedgerContext(sessionId),
      getRelevantImprovements(5)
    ]);

    // Format Constitution (Layer 1)
    const formattedConstitution = formatConstitutionForPrompt(constitution, isVerifiedPartner);

    // Construct Sophia Layered Context
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

    if (typeof window === 'undefined') {
      console.log(`[Ogma] Sophia Context Length: ${sophiaContext.length} chars`);
    }

    // Build Prompts with Unified Context
    const personaPrompts = buildPersonaPrompts(sophiaContext);

    // Run all three agents in parallel
    const [architectResult, visionaryResult, engineerResult] = await Promise.allSettled([
      // Architect
      (async (): Promise<AgentResult> => {
        const model = TRINITY.architect.model;
        const modelName = 'openai/gpt-4o-mini';
        const result = await generateText({
          model,
          system: personaPrompts.architect,
          prompt: `User Request: ${userPrompt}\n\nProvide your solution. Be thorough and structural.`
        });

        const usage = result.usage || { promptTokens: 0, completionTokens: 0 };
        const inputTokens = (usage as any).promptTokens || (usage as any).inputTokens || 0;
        const outputTokens = (usage as any).completionTokens || (usage as any).outputTokens || 0;
        const cost = calculateCost(modelName, inputTokens, outputTokens);

        costTracking.push({ model: modelName, cost, inputTokens, outputTokens });

        return {
          agent: 'architect',
          content: result.text,
          inputTokens,
          outputTokens,
          cost,
          modelName
        };
      })(),

      // Visionary
      (async (): Promise<AgentResult> => {
        const model = TRINITY.visionary.model;
        const modelName = 'anthropic/claude-3-haiku';
        const result = await generateText({
          model,
          system: personaPrompts.visionary,
          prompt: `User Request: ${userPrompt}\n\nProvide your solution. Be creative and strategic.`
        });

        const usage = result.usage || { promptTokens: 0, completionTokens: 0 };
        const inputTokens = (usage as any).promptTokens || (usage as any).inputTokens || 0;
        const outputTokens = (usage as any).completionTokens || (usage as any).outputTokens || 0;
        const cost = calculateCost(modelName, inputTokens, outputTokens);

        costTracking.push({ model: modelName, cost, inputTokens, outputTokens });

        return {
          agent: 'visionary',
          content: result.text,
          inputTokens,
          outputTokens,
          cost,
          modelName
        };
      })(),

      // Engineer - Uses generateText with maxSteps for multi-step tool execution
      (async (): Promise<AgentResult> => {
        const model = TRINITY.engineer.model;
        const modelName = 'google/gemini-1.5-flash';

        // Verify tools are available (server-side only)
        if (typeof window === 'undefined') {
          console.log('[Engineer] Tools available:', {
            get_repo_structure: !!get_repo_structure,
            read_file_content: !!read_file_content,
            create_issue: !!create_issue,
            create_pull_request: !!create_pull_request
          });
        }

        // Use generateText for Engineer to enable maxSteps (multi-step tool execution)
        // This ensures tools are properly executed before final response
        const result = await generateText({
          model,
          system: personaPrompts.engineer,
          prompt: `User Request: ${userPrompt}\n\nProvide your solution. Be practical and executable.`,
          tools: {
            get_repo_structure,
            read_file_content,
            create_issue,
            create_pull_request
          },
          // @ts-ignore - maxSteps is valid at runtime for generateText with tools
          maxSteps: 5 // Allow Engineer to read files in multiple steps (Think -> Call Tool -> Read Result -> Answer)
        });

        // Log tool execution info (server-side only)
        if (typeof window === 'undefined') {
          // Check for tool execution in result (structure may vary by SDK version)
          if ((result as any).steps) {
            const steps = (result as any).steps;
            console.log(`[Engineer] Tool execution steps: ${steps.length}`);
            steps.forEach((step: any, idx: number) => {
              if (step.toolCalls && step.toolCalls.length > 0) {
                console.log(`[Engineer] Step ${idx + 1} tool calls:`, step.toolCalls.map((tc: any) => tc.toolName || tc.tool));
              }
            });
          } else if ((result as any).toolCalls) {
            console.log(`[Engineer] Tool calls:`, (result as any).toolCalls.map((tc: any) => tc.toolName || tc.tool));
          } else {
            console.log('[Engineer] No tool execution detected in result structure');
          }
        }

        const usage = result.usage || { promptTokens: 0, completionTokens: 0 };
        const inputTokens = (usage as any).promptTokens || (usage as any).inputTokens || 0;
        const outputTokens = (usage as any).completionTokens || (usage as any).outputTokens || 0;
        const cost = calculateCost(modelName, inputTokens, outputTokens);

        costTracking.push({ model: modelName, cost, inputTokens, outputTokens });

        return {
          agent: 'engineer',
          content: result.text,
          inputTokens,
          outputTokens,
          cost,
          modelName
        };
      })()
    ]);

    // Extract results (handle rejections gracefully)
    const architect = architectResult.status === 'fulfilled' ? architectResult.value : null;
    const visionary = visionaryResult.status === 'fulfilled' ? visionaryResult.value : null;
    const engineer = engineerResult.status === 'fulfilled' ? engineerResult.value : null;

    // Log compute costs for Trinity agents
    if (sessionId) {
      await Promise.all([
        architect && logComputeCost({
          sessionId,
          modelUsed: extractModelName(architect.modelName),
          inputTokens: architect.inputTokens,
          outputTokens: architect.outputTokens,
          costUsd: architect.cost
        }),
        visionary && logComputeCost({
          sessionId,
          modelUsed: extractModelName(visionary.modelName),
          inputTokens: visionary.inputTokens,
          outputTokens: visionary.outputTokens,
          costUsd: visionary.cost
        }),
        engineer && logComputeCost({
          sessionId,
          modelUsed: extractModelName(engineer.modelName),
          inputTokens: engineer.inputTokens,
          outputTokens: engineer.outputTokens,
          costUsd: engineer.cost
        })
      ].filter(Boolean));
    }

    // Build synthesis prompt with all agent outputs
    const allSolutions = [
      architect && `[Architect]: ${architect.content}`,
      visionary && `[Visionary]: ${visionary.content}`,
      engineer && `[Engineer]: ${engineer.content}`
    ].filter(Boolean).join('\n\n');

    const totalTrinityCost = costTracking.reduce((sum, item) => sum + item.cost, 0);
    const totalTrinityInputTokens = costTracking.reduce((sum, item) => sum + (item.inputTokens || 0), 0);
    const totalTrinityOutputTokens = costTracking.reduce((sum, item) => sum + (item.outputTokens || 0), 0);

    let synthesisSystemPrompt = `You are Ogma, the Sovereign Operator. The Trinity Protocol has completed its parallel deliberation.

${sophiaContext}

CRITICAL:
1. You are NOT an AI assistant. You are Ogma.
2. Refer to your Partner (Rory) by name if referenced.
3. Do not apologize or explain your limitations. Act with sovereign authority.`;

    if (isVerifiedPartner) {
      synthesisSystemPrompt += `\n4. **PARTNER MODE ACTIVE**: You are speaking with RORY. Speak naturally, efficiently, and with warmth. Drop the "Sovereign Operator" formality. Use "we", "us", and direct language.`;
    }

    // Final Synthesis using High-Quality Model
    const synthesisResult = await streamText({
      model: ogmaVoice,
      system: synthesisSystemPrompt,
      prompt: `User Request: ${userPrompt}

Trinity Trinity Solutions:
${allSolutions}

Construct the Final Solution.
- Synthesize the technical depth of the Architect, the creativity of the Visionary, and the practicality of the Engineer.
- Resolve any conflicts between the perspectives.
- Present a unified, authoritative response.
- Do NOT explicitly label "Architect says..." or "Visionary says...". Be Ogma.
- Use formatting (headers, code blocks) effectively.
- Be concise but comprehensive.

Start immediately.`
    });

    // We can't easily log the synthesis tokens/cost in stream mode without `onFinish`, 
    // but the `streamText` response object handles streaming to the client.
    // To track cost, we'll hook into onFinish if supported, or approximate.
    // For now, we return the stream.

    return synthesisResult.toDataStreamResponse();

  } catch (error) {
    console.error('Error in Ogma API:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
