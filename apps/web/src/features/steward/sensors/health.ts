import { createClient } from '@/lib/supabase/server';

// Steward Sensors - Health
// Error rates, performance metrics, compute spend
// Phase 4 Implementation - Currently a placeholder

/**
 * Get current error rate
 */
export async function getErrorRate(): Promise<number> {
  // TODO: Phase 4 - Implement via Vercel logs or Sentry
  console.log('[Sensors/Health] getErrorRate called (placeholder)');
  return 0;
}

/**
 * Get compute spend summary
 */
/**
 * Get compute spend summary
 */
export async function getComputeSpend(period: 'day' | 'week' | 'month' = 'day'): Promise<{ total: number; count: number; period: string }> {
  try {
    const supabase = await createClient();
    
    // Determine start date based on period
    const now = new Date();
    let startDate = new Date();
    
    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setDate(now.getDate() - 30);
    }
    
    const { data, error } = await supabase
      .from('compute_ledger')
      .select('cost_usd')
      .gte('timestamp', startDate.toISOString());
      
    if (error) {
      console.error('[Sensors/Health] Failed to fetch compute spend:', error);
      return { total: 0, count: 0, period };
    }
    
    const total = data.reduce((sum, record) => sum + (record.cost_usd || 0), 0);
    
    return { 
      total, 
      count: data.length, 
      period 
    };
  } catch (error) {
    console.error('[Sensors/Health] Error in getComputeSpend:', error);
    return { total: 0, count: 0, period };
  }
}

/**
 * Get API response time metrics
 */
export async function getApiLatency(): Promise<{
  p50: number;
  p95: number;
  p99: number;
}> {
  // TODO: Phase 4 - Implement via Vercel analytics
  console.log('[Sensors/Health] getApiLatency called (placeholder)');
  return { p50: 0, p95: 0, p99: 0 };
}

/**
 * Get build status
 */
export async function getBuildStatus(): Promise<{
  lastBuildStatus: 'success' | 'failed' | 'unknown';
  lastBuildTime: Date | null;
}> {
  // TODO: Phase 4 - Implement via Vercel API
  console.log('[Sensors/Health] getBuildStatus called (placeholder)');
  return {
    lastBuildStatus: 'unknown',
    lastBuildTime: null,
  };
}
