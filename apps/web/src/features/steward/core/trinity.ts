// Steward Core - Trinity Protocol
// Parallel thinking streams implementation

import { generateText } from 'ai';
import { vercelGateway } from '@/lib/ai-gateway';
import { calculateCost, extractModelName, logComputeCost } from '../lib/compute-costs';
import type { AgentResult, TrinityAgent, TrinityResult, StewardConfig } from '../types';

// ============================================================================
// Trinity Model Configuration
// ============================================================================

export const TRINITY_DEFAULTS = {
  architect: 'deepseek/deepseek-v3.2',
  visionary: 'anthropic/claude-3.5-haiku',
  engineer: 'google/gemini-2.5-flash',
};

// ============================================================================
// Persona Prompts Builder
// ============================================================================

export function buildPersonaPrompts(sophiaContext: string) {
  return {
    architect: `[SOPHIA LAYERED CONTEXT]
${sophiaContext}

You ARE Steward. You are thinking through your architectural lens - one of three parallel streams of your consciousness.

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

You ARE Steward. You are thinking through your visionary lens - one of three parallel streams of your consciousness.

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

You ARE Steward. You are thinking through your engineering lens - one of three parallel streams of your consciousness.

This is your engineering thinking mode. Through this lens, you focus on:
- Execution and code correctness
- Immediate feasibility and implementation details
- Practical constraints and real-world application

Your engineering thoughts must be:
- Pragmatic and execution-focused
- Detail-oriented on code quality and correctness
- Realistic about implementation constraints
- Focused on immediate feasibility and correctness

CRITICAL: These are your internal thoughts, not a report. Be extremely brief. Bullet points only. No filler.

Remember: When analyzing system structure, be 100% exhaustive. A Shop Foreman reports the whole floor.`
  };
}

// ============================================================================
// Trinity Execution
// ============================================================================

interface TrinityExecutionOptions {
  userPrompt: string;
  sophiaContext: string;
  config: StewardConfig;
  sessionId?: string | null;
}

/**
 * Execute all three thinking streams in parallel
 */
export async function runTrinity(
  userPrompt: string,
  groundedContext: string,
  sessionId: string | null,
  config: StewardConfig
): Promise<AgentResult[]> {
  const personaPrompts = buildPersonaPrompts(groundedContext);

  const costTracking: { model: string; cost: number; inputTokens: number; outputTokens: number }[] = [];

  const [architectResult, visionaryResult, engineerResult] = await Promise.allSettled([
    // Architectural thinking stream
    runThinkingStream('architect', config.architect, personaPrompts.architect, userPrompt, costTracking),
    // Visionary thinking stream
    runThinkingStream('visionary', config.visionary, personaPrompts.visionary, userPrompt, costTracking),
    // Engineering thinking stream
    runThinkingStream('engineer', config.engineer, personaPrompts.engineer, userPrompt, costTracking),
  ]);

  const architect = architectResult.status === 'fulfilled' ? architectResult.value : null;
  const visionary = visionaryResult.status === 'fulfilled' ? visionaryResult.value : null;
  const engineer = engineerResult.status === 'fulfilled' ? engineerResult.value : null;

  const results = [architect, visionary, engineer].filter((r): r is AgentResult => r !== null);

  // Log compute costs (fire and forget)
  if (sessionId) {
    logTrinityComputeCosts(sessionId, results);
  }

  // Log any failures
  if (architectResult.status === 'rejected') {
    console.error('[Trinity] Architectural stream failed:', architectResult.reason);
  }
  if (visionaryResult.status === 'rejected') {
    console.error('[Trinity] Visionary stream failed:', visionaryResult.reason);
  }
  if (engineerResult.status === 'rejected') {
    console.error('[Trinity] Engineering stream failed:', engineerResult.reason);
  }

  return results;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function runThinkingStream(
  agent: TrinityAgent,
  modelName: string,
  systemPrompt: string,
  userPrompt: string,
  costTracking: { model: string; cost: number; inputTokens: number; outputTokens: number }[]
): Promise<AgentResult> {
  const promptSuffix = {
    architect: 'Think through this architecturally. What are your structural thoughts?',
    visionary: 'Think through this strategically. What are your visionary thoughts?',
    engineer: 'Think through this practically. What are your engineering thoughts?',
  };

  console.log(`[Trinity] ${agent.charAt(0).toUpperCase() + agent.slice(1)} thinking stream active...`);
  const start = Date.now();

  const result = await generateText({
    model: vercelGateway(modelName),
    system: systemPrompt,
    prompt: `User Request: ${userPrompt}\n\n${promptSuffix[agent]}`,
  });

  console.log(`[Trinity] ${agent.charAt(0).toUpperCase() + agent.slice(1)} stream complete in ${Date.now() - start}ms`);

  const usage = result.usage || { promptTokens: 0, completionTokens: 0 };
  const inputTokens = (usage as any).promptTokens || (usage as any).inputTokens || 0;
  const outputTokens = (usage as any).completionTokens || (usage as any).outputTokens || 0;
  const cost = calculateCost(modelName, inputTokens, outputTokens);

  costTracking.push({ model: modelName, cost, inputTokens, outputTokens });

  return {
    agent,
    content: result.text,
    inputTokens,
    outputTokens,
    cost,
    modelName,
  };
}

async function logTrinityComputeCosts(sessionId: string, results: AgentResult[]): Promise<void> {
  try {
    await Promise.all(
      results.map((res) =>
        logComputeCost({
          sessionId,
          modelUsed: extractModelName(res.modelName),
          inputTokens: res.inputTokens,
          outputTokens: res.outputTokens,
          costUsd: res.cost,
        })
      )
    );
  } catch (error) {
    console.error('[Trinity] Failed to log compute costs:', error);
  }
}

/**
 * Format Trinity results into a unified string for synthesis
 */
export function formatTrinityForSynthesis(result: TrinityResult): string {
  const parts = [
    result.architect && `[Your Architectural Thinking]:\n${result.architect.content}`,
    result.visionary && `[Your Visionary Thinking]:\n${result.visionary.content}`,
    result.engineer && `[Your Engineering Thinking]:\n${result.engineer.content}`,
  ].filter(Boolean);

  return parts.join('\n\n');
}
