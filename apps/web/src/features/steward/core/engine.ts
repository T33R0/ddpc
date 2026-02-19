// Steward Core - Engine
// Orchestrates the full Steward pipeline: Scout → Trinity → Synthesis

import type { StewardConfig, EngineInput, EngineOutput } from '../types';
import { runTrinity } from './trinity';
import { runScout } from './scout';

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_CONFIG: StewardConfig = {
  synthesizer: 'anthropic/claude-3.5-haiku',
  architect: 'deepseek/deepseek-v3.2',
  visionary: 'anthropic/claude-3.5-haiku',
  engineer: 'google/gemini-2.5-flash',
};

// EngineInput is imported from ../types

// ============================================================================
// Main Orchestrator
// ============================================================================

/**
 * Run the full Steward pipeline
 *
 * Phase 2: Scout → Trinity
 * (Synthesis is handled by the API route for streaming)
 */
export async function runSteward(input: EngineInput): Promise<EngineOutput> {
  const { userPrompt, sessionId, config, sophiaContext } = input;

  // Phase 1: Scout Reconnaissance
  const scoutBriefing = await runScout(userPrompt, sessionId, config);

  // Combine Sophia context with Scout findings
  const groundedContext = `${sophiaContext}

## 4. SCOUT RECONNAISSANCE
${scoutBriefing.context}`;

  // Phase 2: Trinity Parallel Thinking
  const trinityResults = await runTrinity(
    userPrompt,
    groundedContext,
    sessionId,
    config
  );

  // Format trinity results for synthesis
  const allSolutions = trinityResults
    .map(r => `[Your ${r.agent.charAt(0).toUpperCase() + r.agent.slice(1)} Thinking]:\n${r.content}`)
    .join('\n\n');

  return {
    scoutBriefing,
    trinityResults,
    groundedContext,
    allSolutions,
  };
}

// Re-export for convenience
export { runTrinity } from './trinity';
export { runScout } from './scout';
// export { runSynthesis } from './synthesizer'; // Removed if not used/imported to avoid unused var
