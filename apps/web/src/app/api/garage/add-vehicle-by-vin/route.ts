import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { trackGrowthEvent } from '@/lib/analytics';

interface NhtsaVariable {
  Value: string | null;
  Variable: string;
  ErrorCode?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { vin } = await request.json();

    if (!vin) {
      return NextResponse.json({ error: 'VIN is required' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch data from NHTSA vPIC API
    const nhtsaResponse = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinExtended/${vin}?format=json`);
    if (!nhtsaResponse.ok) {
      return NextResponse.json({ error: 'Failed to decode VIN' }, { status: 502 });
    }

    const vinData = await nhtsaResponse.json();
    const results: NhtsaVariable[] = vinData.Results;

    // Check if the VIN was valid according to NHTSA
    const hasError = results.some((r: NhtsaVariable) => r.ErrorCode && r.ErrorCode !== '0');
    if (hasError || results.length === 0) {
      return NextResponse.json({ 
        error: "We're unable to match this VIN to a vehicle in the NHTSA database. Please ensure you entered your VIN correctly." 
      }, { status: 404 });
    }

    const getValue = (variable: string) => results.find((r: NhtsaVariable) => r.Variable === variable)?.Value || null;

    const make = getValue('Make');
    const model = getValue('Model');
    const yearString = getValue('Model Year');
    const trim = getValue('Trim');

    // Predictive Validation: Ensure critical data is present before proceeding
    if (!make || !model || !yearString) {
      return NextResponse.json({
        error: "The VIN provided is valid, but we couldn't retrieve the minimum required vehicle data (make, model, and year).",
      }, { status: 404 });
    }

    const year = parseInt(yearString, 10);

    let vehicleDataToInsert;
    let matchFound = false;

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
      matchFound = true;
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
        current_status: 'active'
      };
    } else {
      // No match found. Fallback to building the snapshot from NHTSA data.
      const specSnapshot = results.reduce((acc: { [key: string]: string }, curr: NhtsaVariable) => {
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
        current_status: 'active'
      };
    }

    const { data: newVehicle, error: insertError } = await supabase
      .from('user_vehicle')
      .insert(vehicleDataToInsert)
      .select('id, owner_id') // Ensure we get owner_id back for seeding
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Failed to add vehicle', details: insertError.message }, { status: 500 });
    }

    // If the vehicle was matched to stock data, seed the maintenance plan
    if (matchFound && newVehicle) {
      // Re-implement the seeding logic here, adapted from the main add-vehicle route
      try {
        const { data: masterSchedule, error: scheduleError } = await supabase
          .from('master_service_schedule')
          .select('*')
          .eq('vehicle_data_id', vehicleDataToInsert.stock_data_id);

        if (scheduleError) throw scheduleError;

        if (masterSchedule && masterSchedule.length > 0) {
          const intervalsToSeed = masterSchedule.map((item) => ({
            user_id: newVehicle.owner_id,
            user_vehicle_id: newVehicle.id,
            master_service_schedule_id: item.id,
            name: item.name,
            interval_months: item.interval_months,
            interval_miles: item.interval_miles,
          }));

          const { error: insertIntervalsError } = await supabase
            .from('service_intervals')
            .insert(intervalsToSeed);

          if (insertIntervalsError) throw insertIntervalsError;
        }
      } catch (seedingError) {
        console.error(
          `[Seeding Pipeline Failed] for user ${user.id} and vehicle ${newVehicle.id}:`,
          seedingError
        );
      }
    }

    // Track growth event
    trackGrowthEvent('vehicle_added', user.id, {
      vehicleId: newVehicle.id,
      make: make,
      model: model,
      year: year,
      method: 'vin',
      matchFound,
    })

    return NextResponse.json({
      success: true,
      vehicleId: newVehicle.id,
      matchFound: matchFound
    });

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Internal server error:', error.message);
    } else {
      console.error('An unknown error occurred');
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
