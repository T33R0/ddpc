import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { vin } = await request.json();

    if (!vin) {
      return NextResponse.json({ error: 'VIN is required' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch data from NHTSA vPIC API
    const nhtsaResponse = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinExtended/${vin}?format=json`);
    if (!nhtsaResponse.ok) {
      return NextResponse.json({ error: 'Failed to decode VIN' }, { status: 502 });
    }

    const vinData = await nhtsaResponse.json();
    const results = vinData.Results;

    const getValue = (variable: string) => results.find((r: any) => r.Variable === variable)?.Value || null;

    // The established schema stores detailed specs in a JSONB column.
    // We will gather all relevant specs into a snapshot object.
    const specSnapshot = results.reduce((acc: any, curr: any) => {
      if (curr.Value && curr.Value !== 'Not Applicable' && curr.Variable) {
        // Sanitize the key to be valid for a JSON object
        const key = curr.Variable.replace(/ /g, '_').toLowerCase();
        acc[key] = curr.Value;
      }
      return acc;
    }, {});

    const vehicleData = {
      owner_id: user.id,
      vin: vin,
      year: parseInt(getValue('Model Year'), 10),
      make: getValue('Make'),
      model: getValue('Model'),
      trim: getValue('Trim') || 'N/A',
      // Store the detailed specs in the JSONB snapshot field
      spec_snapshot: specSnapshot,
    };

    const { data: newVehicle, error: insertError } = await supabase
      .from('user_vehicle')
      .insert(vehicleData)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Failed to add vehicle', details: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, vehicle: newVehicle });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
