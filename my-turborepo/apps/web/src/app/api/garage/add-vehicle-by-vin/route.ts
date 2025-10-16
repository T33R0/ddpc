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

    const make = getValue('Make');
    const model = getValue('Model');
    const year = parseInt(getValue('Model Year'), 10);
    const trim = getValue('Trim');

    let vehicleDataToInsert;

    // First, try to find a match in our curated vehicle_data table
    const { data: matchedVehicle } = await supabase
      .from('vehicle_data')
      .select('*')
      .eq('make', make)
      .eq('model', model)
      .eq('year', year)
      .limit(1)
      .maybeSingle();

    if (matchedVehicle) {
      // Match found! Use our rich, internal data.
      const fullSpec = JSON.parse(JSON.stringify(matchedVehicle));
      vehicleDataToInsert = {
        owner_id: user.id,
        vin: vin,
        year: matchedVehicle.year,
        make: matchedVehicle.make,
        model: matchedVehicle.model,
        trim: matchedVehicle.trim,
        photo_url: matchedVehicle.image_url,
        stock_data_id: matchedVehicle.id,
        title: matchedVehicle.trim_description || matchedVehicle.trim,
        spec_snapshot: fullSpec,
        current_status: 'daily_driver'
      };
    } else {
      // No match found. Fallback to building the snapshot from NHTSA data.
      const specSnapshot = results.reduce((acc: any, curr: any) => {
        if (curr.Value && curr.Value !== 'Not Applicable' && curr.Variable) {
          const key = curr.Variable.replace(/ /g, '_').toLowerCase();
          acc[key] = curr.Value;
        }
        return acc;
      }, {});

      vehicleDataToInsert = {
        owner_id: user.id,
        vin: vin,
        year: year,
        make: make,
        model: model,
        trim: trim || 'N/A',
        spec_snapshot: specSnapshot,
        current_status: 'daily_driver'
      };
    }

    const { data: newVehicle, error: insertError } = await supabase
      .from('user_vehicle')
      .insert(vehicleDataToInsert)
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
