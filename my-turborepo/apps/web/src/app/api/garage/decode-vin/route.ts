import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

interface NHTSAResult {
  Value: string | null;
  ValueId: string | null;
  Variable: string;
  VariableId: number;
  ErrorCode?: string;
}

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
    const hasError = results.some((r: NHTSAResult) => r.ErrorCode && r.ErrorCode !== '0');
    if (hasError || results.length === 0) {
      return NextResponse.json({
        error: "We're unable to match this VIN to a vehicle in the NHTSA database. Please ensure you entered your VIN correctly."
      }, { status: 404 });
    }

    // Parse NHTSA results first as we might need them for enrichment
    const getValue = (variable: string) => results.find((r: NHTSAResult) => r.Variable === variable)?.Value || null;

    const make = getValue('Make');
    const model = getValue('Model');
    const year = parseInt(getValue('Model Year'), 10);
    const trim = getValue('Trim');

    // Build the spec object from NHTSA regardless of match status
    const nhtsaSpecs = {
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
    };

    // Also build the full snapshot
    const specSnapshot = results.reduce((acc: Record<string, string | null>, curr: NHTSAResult) => {
      if (curr.Value && curr.Value !== 'Not Applicable' && curr.Variable) {
        const key = curr.Variable.replace(/ /g, '_').toLowerCase();
        acc[key] = curr.Value;
      }
      return acc;
    }, {});

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
        .from('v_vehicle_explore')
        .select('*')
        .eq('make', make)
        .eq('model', model)
        .eq('year', year)
        .limit(1);

      if (vehicleSummaries && vehicleSummaries.length > 0) {
        // Ensure trims exists
        const vehicleData = vehicleSummaries[0];
        if (!vehicleData.trims) {
          vehicleData.trims = [];
        }

        // ENRICHMENT: If we found a vehicle, let's fill in any missing blanks with NHTSA data
        // We act on the specific selected trim if possible, but since we don't know which trim corresponds
        // to the VIN's specific trim without more logic, we will apply these enrichments to the PRIMARY trim found
        // if it matches, or arguably we could just return them as "overrides" for the frontend to handle.
        // However, the cleanest way is to iterate over the trims and if we find one that looks like a base match, enrich it.
        // For simplicity in this "preview" phase, we will enrich ALL trims that have missing data with the high-level specs
        // from the VIN decode (e.g. if the DB doesn't know the Body Type, but VIN does, apply it).

        vehicleData.trims = vehicleData.trims.map((t: any) => {
          // Create a new enriched trim object
          const enriched = { ...t };

          // List of fields we want to backfill if missing in DB
          const fieldsToEnrich = [
            'engine_size_l', 'cylinders', 'horsepower_hp', 'torque_ft_lbs',
            'fuel_type', 'drive_type', 'transmission', 'body_type',
            'epa_combined_mpg', 'epa_city_highway_mpg', 'curb_weight_lbs'
          ];

          fieldsToEnrich.forEach(field => {
            // If local data is null/undefined, and we have NHTSA data, use it
            if ((enriched[field] === null || enriched[field] === undefined || enriched[field] === '') && (nhtsaSpecs as any)[field]) {
              enriched[field] = (nhtsaSpecs as any)[field];
            }
          });

          return enriched;
        });

        return NextResponse.json({
          success: true,
          vehicleData: vehicleData,
          matchFound: true
        });
      }
    }

    // No match found in curated data, build from NHTSA data
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
        ...nhtsaSpecs,
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
