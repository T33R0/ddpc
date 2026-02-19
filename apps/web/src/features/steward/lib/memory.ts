
import { createClient } from '@/lib/supabase/server';

export interface OgmaImprovement {
    id: string;
    created_at: string;
    category: string;
    insight: string;
    confidence_score: number;
}

/**
 * Fetches the top relevant improvements (high confidence) to inject into Ogma's context.
 * Useful for "Learning" behavior.
 */
export async function getRelevantImprovements(limit: number = 5): Promise<string> {
    const supabase = await createClient();

    // Fetch top improvements: high confidence, most recent
    const { data, error } = await supabase
        .from('ogma_improvements')
        .select('category, insight, confidence_score')
        .gte('confidence_score', 75) // Only high confidence
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching Ogma improvements:', error);
        return '';
    }

    if (!data || data.length === 0) {
        return '';
    }

    // Format as a context block string
    const formatted = data.map(item =>
        `- [${item.category}] (Confidence: ${item.confidence_score}%): ${item.insight}`
    ).join('\n');

    return `\n\n## Learned Improvements\nOgma has internalized the following lessons from previous operations:\n${formatted}\n`;
}

/**
 * Records a new improvement/insight.
 */
export async function recordImprovement(
    category: 'Correction' | 'Strategy' | 'Preference' | 'Insight',
    insight: string,
    confidenceScore: number,
    sourceSessionId?: string
) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('ogma_improvements')
        .insert({
            category,
            insight,
            confidence_score: confidenceScore,
            source_session_id: sourceSessionId
        });

    if (error) {
        console.error('Failed to record improvement:', error);
    }
}
