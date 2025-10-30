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

    // Fetch data from NHTSA vPIC API
    const nhtsaResponse = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinExtended/${vin}?format=json`);
    if (!nhtsaResponse.ok) {
      return NextResponse.json({ error: 'Failed to decode VIN' }, { status: 502 });
    }

    const vinData = await nhtsaResponse.json();
    const results = vinData.Results;

    // Check if the VIN was valid according to NHTSA
    const hasError = results.some((r: any) => r.ErrorCode && r.ErrorCode !== '0');
    if (hasError || results.length === 0) {
      return NextResponse.json({
        error: "We're unable to match this VIN to a vehicle in the NHTSA database. Please ensure you entered your VIN correctly."
      }, { status: 404 });
    }

    const getValue = (variable: string) => results.find((r: any) => r.Variable === variable)?.Value || null;

    const make = getValue('Make');
    const model = getValue('Model');
    const year = parseInt(getValue('Model Year'), 10);
    const trim = getValue('Trim');

    // Try to find a match in our curated vehicle_data table
    const { data: matchedVehicle } = await supabase
      .from('vehicle_data')
      .select('*')
      .eq('make', make)
      .eq('model', model)
      .eq('year', year)
      .limit(1)
      .maybeSingle();

    if (matchedVehicle) {
      // Match found! Return our rich vehicle data
      const { data: vehicleSummaries } = await supabase
        .from('v_vehicle_discovery')
        .select('*')
        .eq('make', make)
        .eq('model', model)
        .eq('year', year)
        .limit(1);

      if (vehicleSummaries && vehicleSummaries.length > 0) {
        return NextResponse.json({
          success: true,
          vehicleData: vehicleSummaries[0],
          matchFound: true
        });
      }
    }

    // No match found in curated data, build from NHTSA data
    const specSnapshot = results.reduce((acc: any, curr: any) => {
      if (curr.Value && curr.Value !== 'Not Applicable' && curr.Variable) {
        const key = curr.Variable.replace(/ /g, '_').toLowerCase();
        acc[key] = curr.Value;
      }
      return acc;
    }, {});

    // Create a minimal vehicle summary from NHTSA data
    const vehicleData = {
      id: `vin-${vin}`,
      year: year.toString(),
      make: make,
      model: model,
      heroImage: null,
      trims: [{
        id: `vin-trim-${vin}`,
        make: make,
        model: model,
        year: year.toString(),
        trim: trim || 'Base',
        trim_description: trim || 'Base Trim',
        engine_size_l: getValue('Displacement (L)'),
        cylinders: getValue('Engine Number of Cylinders'),
        horsepower_hp: getValue('Engine Brake (hp) From'),
        torque_ft_lbs: getValue('Engine Torque (ft-lbs) From'),
        fuel_type: getValue('Fuel Type - Primary'),
        drive_type: getValue('Drive Type'),
        transmission: getValue('Transmission Style'),
        body_type: getValue('Body Class'),
        epa_combined_mpg: getValue('EPA Combined City/Hwy MPG'),
        epa_city_highway_mpg: getValue('City/Hwy MPG'),
        curb_weight_lbs: getValue('Curb Weight (lbs)'),
        ...specSnapshot
      }]
    };

    return NextResponse.json({
      success: true,
      vehicleData,
      matchFound: false
    });

  } catch (error) {
    console.error('VIN decode error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
