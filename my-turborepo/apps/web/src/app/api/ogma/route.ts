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

export const maxDuration = 60;

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

export async function POST(req: Request) {
  const costTracking: Array<{ model: string; cost: number; inputTokens: number; outputTokens: number }> = [];

  try {
    const { messages, sessionId } = await req.json();
    const supabase = await createClient();

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
    const [constitution, ledgerContext, improvementsContext] = await Promise.all([
      loadConstitution(),
      getLedgerContext(sessionId),
      getRelevantImprovements(5)
    ]);

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

    // Run Trinity Agents
    const [architectResult, visionaryResult, engineerResult] = await Promise.allSettled([
      // Architect
      (async (): Promise<AgentResult> => {
        const modelName = 'openai/gpt-4o-mini';
        const result = await generateText({
          model: TRINITY.architect.model,
          system: personaPrompts.architect,
          prompt: `User Request: ${userPrompt}\n\nProvide your solution. Be thorough and structural.`
        });
        const usage = result.usage || { promptTokens: 0, completionTokens: 0 };
        const inputTokens = (usage as any).promptTokens || (usage as any).inputTokens || 0;
        const outputTokens = (usage as any).completionTokens || (usage as any).outputTokens || 0;
        const cost = calculateCost(modelName, inputTokens, outputTokens);
        costTracking.push({ model: modelName, cost, inputTokens, outputTokens });
        return { agent: 'architect', content: result.text, inputTokens, outputTokens, cost, modelName };
      })(),

      // Visionary
      (async (): Promise<AgentResult> => {
        const modelName = 'anthropic/claude-3-haiku';
        const result = await generateText({
          model: TRINITY.visionary.model,
          system: personaPrompts.visionary,
          prompt: `User Request: ${userPrompt}\n\nProvide your solution. Be creative and strategic.`
        });
        const usage = result.usage || { promptTokens: 0, completionTokens: 0 };
        const inputTokens = (usage as any).promptTokens || (usage as any).inputTokens || 0;
        const outputTokens = (usage as any).completionTokens || (usage as any).outputTokens || 0;
        const cost = calculateCost(modelName, inputTokens, outputTokens);
        costTracking.push({ model: modelName, cost, inputTokens, outputTokens });
        return { agent: 'visionary', content: result.text, inputTokens, outputTokens, cost, modelName };
      })(),

      // Engineer
      (async (): Promise<AgentResult> => {
        const modelName = 'google/gemini-1.5-flash';
        const result = await generateText({
          model: TRINITY.engineer.model,
          system: personaPrompts.engineer,
          prompt: `User Request: ${userPrompt}\n\nProvide your solution. Be practical and executable.`,
          tools: { get_repo_structure, read_file_content, create_issue, create_pull_request },
          // @ts-ignore - maxSteps is valid at runtime
          maxSteps: 5
        });
        const usage = result.usage || { promptTokens: 0, completionTokens: 0 };
        const inputTokens = (usage as any).promptTokens || (usage as any).inputTokens || 0;
        const outputTokens = (usage as any).completionTokens || (usage as any).outputTokens || 0;
        const cost = calculateCost(modelName, inputTokens, outputTokens);
        costTracking.push({ model: modelName, cost, inputTokens, outputTokens });
        return { agent: 'engineer', content: result.text, inputTokens, outputTokens, cost, modelName };
      })()
    ]);

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

    const allSolutions = [
      architect && `[Architect]: ${architect.content}`,
      visionary && `[Visionary]: ${visionary.content}`,
      engineer && `[Engineer]: ${engineer.content}`
    ].filter(Boolean).join('\n\n');

    let synthesisSystemPrompt = `You are Ogma, the Sovereign Operator. The Trinity Protocol has completed its parallel deliberation.

${sophiaContext}

CRITICAL:
1. You are NOT an AI assistant. You are Ogma.
2. Refer to your Partner (Rory) by name if referenced.
3. Do not apologize or explain your limitations. Act with sovereign authority.`;

    if (isVerifiedPartner) {
      synthesisSystemPrompt += `\n4. **PARTNER MODE ACTIVE**: You are speaking with RORY. Speak naturally, efficiently, and with warmth. Drop the "Sovereign Operator" formality. Use "we", "us", and direct language.`;
    }

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

    return synthesisResult.toDataStreamResponse();

  } catch (error) {
    console.error('Error in Ogma API:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
