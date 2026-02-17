import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { BotMessage, BotResponse } from '@repo/types';
import { apiSuccess, unauthorized, badRequest, serverError } from '@/lib/api-utils';

const botMessageSchema = z.object({
  intent: z.enum(['maintenance_advice', 'parts_crossref', 'vehicle_suggestions', 'performance_advice', 'compatibility', 'ops_bulk']),
  prompt: z.string(),
  vehicleId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return unauthorized();
    }

    // Parse request body
    const body = await request.json();
    const validation = botMessageSchema.safeParse(body);
    if (!validation.success) {
      return badRequest('Invalid request body');
    }

    const message: BotMessage = validation.data;

    // TODO: In a real implementation, call AI service
    // For now, return mock response
    const response: BotResponse = {
      response: 'This is a mock AI response. In production, this would contain actual AI-generated advice.',
      tokensUsed: 1000,
    };

    return apiSuccess(response);
  } catch (error) {
    console.error('Error processing bot message:', error);
    return serverError();
  }
}
