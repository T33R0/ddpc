import { tool, jsonSchema } from 'ai';
import { ogmaSensors } from '../sensors';

// Helper to create tools with type erasure for TypeScript
const createUntypedTool = (config: any): any => tool(config);

/**
 * Tool: query_ogma_stats
 * Returns component health, compute spend, and usage stats.
 * Allows Ogma to understand its own operational state.
 */
export const query_ogma_stats = createUntypedTool({
  description: 'Returns real-time statistics about Ogma including compute spend, active users, and error rates.',
  parameters: jsonSchema({
    type: 'object',
    properties: {
      metric: { 
        type: 'string', 
        enum: ['spend', 'usage', 'health', 'all'],
        description: 'The specific metric to query. Defaults to "all".' 
      },
      period: { 
        type: 'string', 
        enum: ['day', 'week', 'month'],
        description: 'Time period for the query. Defaults to "day".' 
      },
    },
  }),
  execute: async ({ metric = 'all', period = 'day' }: { metric?: string; period?: 'day' | 'week' | 'month' }) => {
    
    if (typeof window === 'undefined') {
      console.log(`[query_ogma_stats] Tool called with metric: ${metric}, period: ${period}`);
    }

    try {
      const results: any = {};

      // Execute queries in parallel based on requested metric
      const promises = [];

      if (metric === 'spend' || metric === 'all') {
        promises.push(
          ogmaSensors.health.getComputeSpend(period)
            .then(data => results.compute_spend = data)
            .catch(err => results.compute_spend_error = err.message)
        );
      }

      if (metric === 'usage' || metric === 'all') {
        promises.push(
          ogmaSensors.analytics.getOgmaUsage()
            .then(data => results.usage = data)
            .catch(err => results.usage_error = err.message)
        );
      }

      if (metric === 'health' || metric === 'all') {
        promises.push(
          ogmaSensors.health.getErrorRate()
            .then(data => results.error_rate = data)
            .catch(err => results.health_error = err.message)
        );
      }

      await Promise.all(promises);

      return {
        success: true,
        query: { metric, period },
        data: results
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[query_ogma_stats] Error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});
