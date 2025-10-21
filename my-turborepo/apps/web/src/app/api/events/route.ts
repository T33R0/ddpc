import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPlanForUser, requireFeature, checkLimit } from '@/lib/plan-utils';
import { z } from 'zod';
import type { EventData, UpgradeRequiredError } from '@repo/types';

const createEventSchema = z.object({
  vehicleId: z.string(),
  type: z.enum(['maintenance', 'historical']),
  title: z.string(),
  description: z.string().optional(),
  date: z.string(),
  odometer: z.number().optional(),
  photos: z.array(z.string()).optional(),
});

const markDoneSchema = z.object({
  eventId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user tier
    const tier = await getPlanForUser(user.id);

    // Parse request body
    const body = await request.json();
    const validation = createEventSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const eventData: EventData = validation.data;

    // T0 cannot create future-dated events
    if (tier === 'T0' && new Date(eventData.date) > new Date()) {
      const error: UpgradeRequiredError = {
        code: 'UPGRADE_REQUIRED',
        targetTier: 'T1',
        message: 'Future-dated events require a paid plan'
      };
      return NextResponse.json(error, { status: 403 });
    }

    // Check maintenance scheduling feature for T1+
    if (eventData.type === 'maintenance' && !requireFeature(tier, 'maintenance_scheduling')) {
      const error: UpgradeRequiredError = {
        code: 'UPGRADE_REQUIRED',
        targetTier: 'T1',
        message: 'Maintenance scheduling requires a paid plan'
      };
      return NextResponse.json(error, { status: 403 });
    }

    // TODO: In a real implementation, save event to database
    // For now, return success

    return NextResponse.json({ success: true, eventId: 'mock-id' });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const validation = markDoneSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { eventId } = validation.data;

    // TODO: In a real implementation, mark event as done in database
    // For now, return success

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking event done:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
