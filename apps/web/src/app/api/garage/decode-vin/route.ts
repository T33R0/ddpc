import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decodeVin } from '@/lib/nhtsa';

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

    // Use shared VIN decoding logic
    const decodedVal = await decodeVin(vin);

    if (!decodedVal) {
       return NextResponse.json({
        error: "We're unable to match this VIN to a vehicle in the NHTSA database. Please ensure you entered your VIN correctly."
      }, { status: 404 });
    }

    const { make, model, year, trim, specs, full_data } = decodedVal;

    // Try to find a match in our curated vehicle_data table using case-insensitive matching
    const { data: matchedVehicles } = await supabase
      .from('vehicle_data')
      .select('*')
      .ilike('make', make || '')
      .ilike('model', model || '')
      .eq('year', year || 0);

    if (matchedVehicles && matchedVehicles.length > 0) {
      // Logic to find the BEST match based on VIN-decoded specs
      let bestMatch = matchedVehicles[0];
      let bestScore = 0;

      for (const vehicle of matchedVehicles) {
        let score = 0;
        
        // Trim match (high priority - but NHTSA often returns null for trim)
        if (trim && vehicle.trim && vehicle.trim.toLowerCase() === trim.toLowerCase()) {
          score += 10;
        }

        // Engine displacement match (high priority for engine variant identification)
        if (specs.engine_size_l && vehicle.engine_size_l) {
          const vinEngine = parseFloat(String(specs.engine_size_l));
          const dbEngine = parseFloat(String(vehicle.engine_size_l));
          if (!isNaN(vinEngine) && !isNaN(dbEngine) && Math.abs(vinEngine - dbEngine) < 0.1) {
            score += 8; // Increased priority - this is how we distinguish EcoBoost from V8
          }
        }
        
        // Cylinder count match (medium-high priority)
        if (specs.cylinders && vehicle.cylinders) {
          if (String(vehicle.cylinders) === String(specs.cylinders)) {
            score += 6;
          }
        }

        // Horsepower match (medium priority - further refines engine variant)
        if (specs.horsepower_hp && vehicle.horsepower_hp) {
          const vinHp = parseFloat(String(specs.horsepower_hp));
          const dbHp = parseFloat(String(vehicle.horsepower_hp));
          if (!isNaN(vinHp) && !isNaN(dbHp) && Math.abs(vinHp - dbHp) < 20) {
            score += 4;
          }
        }

        // Drive type match (lower priority)
        if (specs.drive_type && vehicle.drive_type) {
          if (String(vehicle.drive_type).toLowerCase().includes(String(specs.drive_type).toLowerCase()) ||
              String(specs.drive_type).toLowerCase().includes(String(vehicle.drive_type).toLowerCase())) {
            score += 2;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = vehicle;
        }
      }

      console.log(`[VIN Decode] Best match found with score ${bestScore}: ${bestMatch.trim || 'No Trim'} ${bestMatch.engine_size_l}L ${bestMatch.cylinders}-cyl`);

      // AUTO-POPULATION: If score is low (no exact engine match), create the missing combo
      // Score < 14 means no trim+engine match (max possible with trim+engine is 18)
      const EXACT_MATCH_THRESHOLD = 14;
      const needsAutoCreation = bestScore < EXACT_MATCH_THRESHOLD && 
        specs.engine_size_l && 
        specs.cylinders;

      let finalMatch = bestMatch;

      if (needsAutoCreation) {
        console.log(`[VIN Decode] Low score (${bestScore}), attempting to auto-create missing trim/engine combo...`);
        
        // Find a record with the same trim to use as a template (or closest match)
        const trimToUse = trim || bestMatch.trim || 'Base';
        const templateRecord = matchedVehicles.find(v => 
          v.trim?.toLowerCase() === trimToUse.toLowerCase()
        ) || bestMatch;

        // Check if this exact combo already exists (same trim + engine + cylinders)
        const { data: existingExact } = await supabase
          .from('vehicle_data')
          .select('id')
          .ilike('make', make || '')
          .ilike('model', model || '')
          .eq('year', year || 0)
          .ilike('trim', trimToUse)
          .eq('engine_size_l', specs.engine_size_l)
          .eq('cylinders', String(specs.cylinders))
          .limit(1);

        if (existingExact && existingExact.length > 0) {
          // Exact record already exists, use it
          const existingId = (existingExact[0] as { id: string }).id;
          console.log(`[VIN Decode] Found existing exact match: ${existingId}`);
          const { data: exactMatch } = await supabase
            .from('vehicle_data')
            .select('*')
            .eq('id', existingId)
            .single();
          if (exactMatch) {
            finalMatch = exactMatch;
          }
        } else {
          // Create the new trim/engine combo
          const newId = `vin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          
          // Generate new trim description
          const engineDesc = `${specs.engine_size_l}L ${specs.cylinders}cyl`;
          const hpDesc = specs.horsepower_hp ? ` ${specs.horsepower_hp}hp` : '';
          const newTrimDescription = `${trimToUse} (${engineDesc}${hpDesc}) [VIN-derived]`;

          // Clone template record with VIN-decoded engine specs
          const newRecord: Record<string, unknown> = {
            id: newId,
            make: templateRecord.make,
            model: templateRecord.model,
            year: templateRecord.year,
            trim: trimToUse,
            trim_description: newTrimDescription,
            // Engine specs from VIN (authoritative)
            engine_size_l: specs.engine_size_l,
            cylinders: String(specs.cylinders),
            horsepower_hp: specs.horsepower_hp || null,
            torque_ft_lbs: specs.torque_ft_lbs || null,
            fuel_type: specs.fuel_type || templateRecord.fuel_type,
            drive_type: specs.drive_type || templateRecord.drive_type,
            transmission: specs.transmission || templateRecord.transmission,
            body_type: specs.body_type || templateRecord.body_type,
            // Preserve from template
            base_msrp: templateRecord.base_msrp,
            base_invoice: templateRecord.base_invoice,
            colors_exterior: templateRecord.colors_exterior,
            colors_interior: templateRecord.colors_interior,
            car_classification: templateRecord.car_classification,
            country_of_origin: templateRecord.country_of_origin,
            // Flag as VIN-derived
            source: 'vin_derived',
            created_from_vin: vin
          };

          const { data: insertedRecord, error: insertError } = await supabase
            .from('vehicle_data')
            .insert(newRecord)
            .select()
            .single();

          if (insertError) {
            console.error(`[VIN Decode] Failed to auto-create record:`, insertError.message);
            // Continue with best match if insert fails
          } else if (insertedRecord) {
            console.log(`[VIN Decode] ✅ Auto-created new vehicle_data record: ${newId} (${trimToUse} ${engineDesc})`);
            finalMatch = insertedRecord;
          }
        }
      }

      // Build vehicle data structure directly from finalMatch, enriched with VIN specs
      const enrichedTrim = { ...finalMatch };
      
      // List of fields where VIN data is AUTHORITATIVE and should override stock data
      const authFields = [
        'engine_size_l', 'cylinders', 'horsepower_hp', 'torque_ft_lbs',
        'fuel_type', 'drive_type', 'transmission', 'body_type',
        'epa_combined_mpg', 'epa_city_highway_mpg', 'curb_weight_lbs',
        'length_in', 'width_in', 'height_in'
      ] as const;

      authFields.forEach(field => {
        // If we have valid NHTSA data, use it to override stock data
        if ((specs as any)[field]) {
          (enrichedTrim as any)[field] = (specs as any)[field];
        }
      });

      // Fetch hero image for this vehicle
      const { data: imageData } = await supabase
        .from('vehicle_primary_image')
        .select('url')
        .eq('vehicle_id', finalMatch.id)
        .maybeSingle();

      const vehicleData = {
        id: finalMatch.id,
        year: finalMatch.year?.toString() || year?.toString() || '',
        make: finalMatch.make || make,
        model: finalMatch.model || model,
        heroImage: imageData?.url || null,
        trims: [enrichedTrim], // Return only the best matched trim
        _matchedTrimId: finalMatch.id, // Include the matched ID for the frontend
        _matchScore: bestScore, // Include score for debugging
        _autoCreated: needsAutoCreation && finalMatch.id !== bestMatch.id // Flag if we auto-created
      };

      return NextResponse.json({
        success: true,
        vehicleData: vehicleData,
        matchFound: true
      });
    }

    // No match found in curated data, build from NHTSA data
    // Create a minimal vehicle summary from NHTSA data
    const vehicleData = {
      id: `vin-${vin}`,
      year: year?.toString() || '',
      make: make,
      model: model,
      heroImage: null,
      trims: [{
        id: `vin-trim-${vin}`,
        make: make,
        model: model,
        year: year?.toString() || '',
        trim: trim || 'Base',
        trim_description: trim || 'Base Trim',
        ...specs,
        ...full_data
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
