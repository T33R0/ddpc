import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables are not configured.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
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

    const vehicleData = {
      owner_id: user.id,
      vin: vin,
      year: parseInt(getValue('Model Year'), 10),
      make: getValue('Make'),
      model: getValue('Model'),
      trim: getValue('Trim'),
      body_type: getValue('Body Class'),
      drive_type: getValue('Drivetrain'),
      engine_cylinders: getValue('Engine Number of Cylinders'),
      engine_displacement_l: getValue('Displacement (L)'),
      fuel_type: getValue('Fuel Type - Primary'),
      // Add other relevant fields here
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
