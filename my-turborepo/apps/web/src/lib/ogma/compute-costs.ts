import { createClient } from '@/lib/supabase/server';

// Model pricing per 1M tokens (as of 2025-01-27)
// Prices are in USD per million tokens
// Format: { input: price_per_1M_input_tokens, output: price_per_1M_output_tokens }
// See model-pricing-reference.md for full pricing list
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // DeepSeek models (Cost-optimized)
  'deepseek/deepseek-chat': { input: 0.14, output: 0.28 },
  'deepseek/deepseek-v3.2': { input: 0.20, output: 0.50 }, // Current Architect
  'deepseek/deepseek-v3': { input: 0.20, output: 0.50 },
  'deepseek/deepseek-coder': { input: 0.14, output: 0.28 },

  // Anthropic Claude models
  'anthropic/claude-3.7-sonnet': { input: 3.0, output: 15.0 },
  'anthropic/claude-3.5-sonnet': { input: 3.0, output: 15.0 },
  'anthropic/claude-3.5-haiku': { input: 0.25, output: 1.25 }, // Current Visionary
  'anthropic/claude-haiku-4.5': { input: 0.25, output: 1.25 },
  'anthropic/claude-3-opus': { input: 15.0, output: 75.0 },
  'anthropic/claude-3-sonnet': { input: 3.0, output: 15.0 },
  'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },

  // Google Gemini models
  'google/gemini-2.5-pro': { input: 1.25, output: 5.0 },
  'google/gemini-2.5-flash': { input: 0.30, output: 2.50 }, // Current Engineer
  'google/gemini-2.0-flash': { input: 0.20, output: 0.50 },
  'google/gemini-pro': { input: 0.5, output: 1.5 },
  'google/gemini-ultra': { input: 0.0, output: 0.0 }, // Pricing TBD

  // OpenAI models
  'openai/gpt-5': { input: 2.5, output: 10.0 },
  'openai/gpt-4-turbo': { input: 10.0, output: 30.0 },
  'openai/gpt-4o-mini': { input: 0.15, output: 0.60 },
  'openai/gpt-4': { input: 30.0, output: 60.0 },
  'openai/gpt-3.5-turbo': { input: 0.5, output: 1.5 },

  // XAI models
  'xai/grok-4': { input: 3.0, output: 15.0 },
  'xai/grok-3': { input: 2.0, output: 10.0 },

  // Perplexity models
  'perplexity/sonar-pro': { input: 3.0, output: 15.0 },

  // Default fallback (conservative estimate)
  'default': { input: 2.0, output: 8.0 }
};

/**
 * Calculate cost in USD based on model, input tokens, and output tokens
 */
export function calculateCost(
  modelName: string,
  inputTokens: number,
  outputTokens: number
): number {
  // Normalize model name (remove gateway prefixes if any)
  const normalizedModel = modelName.toLowerCase().replace(/^.*\//, '');
  const fullModelName = modelName.toLowerCase();

  // Try to find exact match first
  const pricing = MODEL_PRICING[fullModelName] ||
    MODEL_PRICING[normalizedModel] ||
    MODEL_PRICING['default'];

  if (!pricing) {
    console.warn(`No pricing found for model: ${modelName}, using default`);
    const defaultPricing = MODEL_PRICING['default']!; // Safe because we always define 'default'
    const inputCost = (inputTokens / 1_000_000) * defaultPricing.input;
    const outputCost = (outputTokens / 1_000_000) * defaultPricing.output;
    return inputCost + outputCost;
  }

  // Calculate cost: (input_tokens / 1M) * input_price + (output_tokens / 1M) * output_price
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Extract model name from Vercel AI Gateway model identifier
 */
export function extractModelName(modelIdentifier: string): string {
  // Model identifiers from gateway might be like "deepseek/deepseek-chat" or "anthropic/claude-3.7-sonnet"
  // Return as-is, or extract if needed
  return modelIdentifier;
}

/**
 * Log compute cost to the compute_ledger table
 */
export async function logComputeCost(params: {
  sessionId: string | null;
  interactionId?: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}): Promise<void> {
  try {
    const supabase = await createClient();

    // Only log if we have a session ID
    if (!params.sessionId) {
      console.warn('Cannot log compute cost: no session ID provided');
      return;
    }

    const { error } = await supabase
      .from('compute_ledger')
      .insert({
        session_id: params.sessionId,
        interaction_id: params.interactionId || crypto.randomUUID(),
        model_used: params.modelUsed,
        input_tokens: params.inputTokens,
        output_tokens: params.outputTokens,
        cost_usd: params.costUsd,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to log compute cost:', error);
      // Don't throw - cost logging should not break the main flow
    }
  } catch (error) {
    console.error('Error in logComputeCost:', error);
    // Silently fail - cost logging is non-critical
  }
}

/**
 * Get compute health summary for a session or all sessions
 */
export async function getComputeHealthSummary(sessionId?: string | null) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .rpc('get_compute_health_summary', {
        p_session_id: sessionId || null
      })
      .single();

    if (error) {
      console.error('Failed to get compute health summary:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getComputeHealthSummary:', error);
    return null;
  }
}


/**
 * Get formatted ledger context for the Sophia Layer
 */
export async function getLedgerContext(sessionId?: string | null): Promise<string> {
  const summary = await getComputeHealthSummary(sessionId);
  if (!summary) return "Ledger inaccessible.";

  // Format into a concise block
  // summary shape: { total_cost_usd, total_input_tokens, total_output_tokens, total_interactions, avg_cost_per_interaction, model_breakdown }

  const totalCost = Number(summary.total_cost_usd || 0).toFixed(4);
  const totalTokens = Number(summary.total_input_tokens || 0) + Number(summary.total_output_tokens || 0);

  return `Total Spend: $${totalCost} USD
Total Tokens: ${totalTokens} (${summary.total_input_tokens || 0} in / ${summary.total_output_tokens || 0} out)
Interactions: ${summary.total_interactions || 0}
Avg Cost/Interaction: $${Number(summary.avg_cost_per_interaction || 0).toFixed(4)} USD`;
}
