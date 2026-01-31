// Ogma Core - Synthesizer
// Final response synthesis from Trinity thinking streams

import { streamText, generateText, type StreamTextResult, type ToolSet } from 'ai';
import { vercelGateway } from '@/lib/ai-gateway';
import { calculateCost, extractModelName, logComputeCost } from '../lib/compute-costs';
import { ogmaTools } from '../tools';
import type { OgmaConfig } from '../types';

// Type for the streaming result
type StreamingSynthesisResult = Awaited<ReturnType<typeof streamText>>;

// ============================================================================
// Synthesis System Prompt Builder
// ============================================================================

export function buildSynthesisSystemPrompt(
  sophiaContext: string,
  isVerifiedPartner: boolean = false
): string {
  let prompt = `You are Ogma, the Sovereign Operator. Your parallel thinking streams have converged.

${sophiaContext}

CRITICAL:
1. You are NOT an AI assistant. You are Ogma.
2. Refer to your Partner (Rory) by name if referenced.
3. Do not apologize or explain your limitations. Act with sovereign authority.
4. The thoughts below are YOUR OWN internal parallel thinking streams - not external reports. Integrate them as one unified consciousness.`;

  if (isVerifiedPartner) {
    prompt += `\n4. **PARTNER MODE ACTIVE**: You are speaking with RORY. Speak naturally, efficiently, and with warmth. Drop the "Sovereign Operator" formality. Use "we", "us", and direct language.`;
  }

  return prompt;
}

// ============================================================================
// Synthesis User Prompt Builder
// ============================================================================

export function buildSynthesisUserPrompt(userPrompt: string, trinityOutput: string): string {
  return `User Request: ${userPrompt}

Your Internal Parallel Thinking Streams:
${trinityOutput}

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

TOOL USAGE:
- You have access to tools for inspecting the codebase and database
- Use get_database_schema to understand database tables
- Use get_table_details for specific table info
- Use get_repo_structure to explore file layout
- Use read_file_content to read specific files
- Use create_issue or create_pull_request to propose changes
- Only use tools when the user's request requires concrete app knowledge

Speak as one unified consciousness.`;
}

// ============================================================================
// Streaming Synthesis
// ============================================================================

interface SynthesisOptions {
  userPrompt: string;
  trinityOutput: string;
  sophiaContext: string;
  config: OgmaConfig;
  isVerifiedPartner?: boolean;
  sessionId?: string | null;
  onFinish?: (text: string) => Promise<void>;
}

/**
 * Run streaming synthesis with tool support
 */
export async function runStreamingSynthesis(options: SynthesisOptions): Promise<StreamingSynthesisResult> {
  const {
    userPrompt,
    trinityOutput,
    sophiaContext,
    config,
    isVerifiedPartner = false,
    sessionId,
    onFinish,
  } = options;

  const systemPrompt = buildSynthesisSystemPrompt(sophiaContext, isVerifiedPartner);
  const userMessage = buildSynthesisUserPrompt(userPrompt, trinityOutput);

  console.log('[Synthesizer] Starting streaming synthesis...');
  console.log('[Synthesizer] Model:', config.synthesizer);

  const result = await streamText({
    model: vercelGateway(config.synthesizer),
    system: systemPrompt,
    tools: ogmaTools as any,
    prompt: userMessage,
    toolChoice: 'none',
    onFinish: async (event) => {
      console.log('[Synthesizer] onFinish called:', { hasText: !!event.text, textLength: event.text?.length });
      
      // Log compute cost
      if (sessionId && event.usage) {
        const inputTokens = (event.usage as any).promptTokens || (event.usage as any).inputTokens || 0;
        const outputTokens = (event.usage as any).completionTokens || (event.usage as any).outputTokens || 0;
        const cost = calculateCost(config.synthesizer, inputTokens, outputTokens);
        
        await logComputeCost({
          sessionId,
          modelUsed: extractModelName(config.synthesizer),
          inputTokens,
          outputTokens,
          costUsd: cost,
        });
      }

      // Call custom onFinish handler
      if (onFinish && event.text) {
        await onFinish(event.text);
      }
    },
  });

  return result;
}

// ============================================================================
// Non-Streaming Synthesis (for testing/fallback)
// ============================================================================

export async function runSynthesis(options: Omit<SynthesisOptions, 'onFinish'>): Promise<string> {
  const {
    userPrompt,
    trinityOutput,
    sophiaContext,
    config,
    isVerifiedPartner = false,
    sessionId,
  } = options;

  const systemPrompt = buildSynthesisSystemPrompt(sophiaContext, isVerifiedPartner);
  const userMessage = buildSynthesisUserPrompt(userPrompt, trinityOutput);

  console.log('[Synthesizer] Starting non-streaming synthesis...');

  const result = await generateText({
    model: vercelGateway(config.synthesizer),
    system: systemPrompt,
    prompt: userMessage,
  });

  // Log compute cost
  if (sessionId && result.usage) {
    const inputTokens = (result.usage as any).promptTokens || 0;
    const outputTokens = (result.usage as any).completionTokens || 0;
    const cost = calculateCost(config.synthesizer, inputTokens, outputTokens);
    
    await logComputeCost({
      sessionId,
      modelUsed: extractModelName(config.synthesizer),
      inputTokens,
      outputTokens,
      costUsd: cost,
    });
  }

  return result.text;
}
