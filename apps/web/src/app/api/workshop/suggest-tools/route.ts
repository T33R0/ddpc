import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateObject } from 'ai';
import { vercelGateway } from '@/lib/ai-gateway';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's active vehicles
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('user_vehicle')
      .select(`
        year,
        make,
        model,
        trim,
        vehicle_data (
          engine_displacement,
          engine_description,
          transmission_description,
          drive_type
        )
      `)
      .eq('user_id', user.id)
      .eq('current_status', 'active');

    if (vehiclesError) {
      console.error('Error fetching vehicles:', vehiclesError);
      return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
    }

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json({ 
        tools: [],
        message: 'No active vehicles found. Add vehicles to your garage to get personalized tool suggestions.'
      });
    }

    // Format vehicle info for AI
    const vehicleDescriptions = vehicles
      .map((v: any) => {
        const vd = v.vehicle_data;
        return `${v.year} ${v.make} ${v.model} ${v.trim || ''} (${vd?.engine_description || vd?.engine_displacement || 'Unknown engine'}, ${vd?.transmission_description || 'Unknown trans'}, ${vd?.drive_type || 'Unknown drive'})`.trim();
      })
      .filter(Boolean)
      .join('\n- ');

    if (!vehicleDescriptions) {
      return NextResponse.json({ 
        tools: [],
        message: 'Could not retrieve vehicle details.'
      });
    }

    // Generate tool suggestions using AI
    const { object } = await generateObject({
      model: vercelGateway.languageModel('openai/gpt-4o-mini'),
      schema: z.object({
        tools: z.array(z.string()).describe('List of tool names commonly needed for these vehicles')
      }),
      system: `You are an expert automotive technician. Based on the user's vehicles, suggest essential tools they should have for common maintenance and repairs. Focus on:
- Tools specific to the vehicle's make/model (e.g., special sockets, removal tools)
- Common maintenance tools needed for the engine type
- Transmission-specific tools if applicable
- General tools everyone working on these vehicles should have

Be specific with tool names (e.g., "10mm deep socket" not just "socket set").
Limit to 15-20 most essential tools.`,
      prompt: `User's Active Vehicles:
- ${vehicleDescriptions}

What essential tools should this user have for maintenance and repairs on these specific vehicles?`
    });

    return NextResponse.json({ 
      tools: object.tools,
      vehicleCount: vehicles.length
    });

  } catch (error) {
    console.error('Error in suggest-tools:', error);
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}
