import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlanForUser, validateIntent, decrementAiBudget, rateLimit } from '@repo/services/planUtils';
import { z } from 'zod';
import type { BotMessage, BotResponse, UpgradeRequiredError } from '@repo/types';

const botMessageSchema = z.object({
  intent: z.enum(['maintenance_advice', 'parts_crossref', 'vehicle_suggestions', 'performance_advice', 'compatibility', 'ops_bulk']),
  prompt: z.string(),
  vehicleId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user tier
    const tier = await getPlanForUser(user.id);

    // Parse request body
    const body = await request.json();
    const validation = botMessageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const message: BotMessage = validation.data;

    // Validate intent is allowed for this tier
    if (!validateIntent(tier, message.intent)) {
      const targetTier = tier === 'T0' ? 'T1' : tier === 'T1' ? 'T2' : 'T3';
      const error: UpgradeRequiredError = {
        code: 'UPGRADE_REQUIRED',
        targetTier,
        message: `This AI feature requires a ${targetTier} plan`
      };
      return NextResponse.json(error, { status: 403 });
    }

    // Check rate limits
    const rateLimitOk = await rateLimit(user.id, 'ai_query', 1); // 1 req/min for T1, etc.
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Check AI budget
    const budgetOk = await decrementAiBudget(user.id, 1000); // Assume 1000 tokens per request
    if (!budgetOk) {
      const error: UpgradeRequiredError = {
        code: 'UPGRADE_REQUIRED',
        targetTier: tier === 'T1' ? 'T2' : 'T3',
        message: 'AI token limit exceeded. Upgrade to continue.'
      };
      return NextResponse.json(error, { status: 403 });
    }

    // TODO: In a real implementation, call AI service
    // For now, return mock response
    const response: BotResponse = {
      response: 'This is a mock AI response. In production, this would contain actual AI-generated advice.',
      tokensUsed: 1000,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing bot message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
