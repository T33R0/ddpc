
interface NHTSAResult {
  Value: string | null;
  ValueId: string | null;
  Variable: string;
  VariableId: number;
  ErrorCode?: string;
}

export interface DecodedVehicle {
  make: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
  specs: {
    engine_size_l: string | null;
    cylinders: string | null;
    horsepower_hp: string | null;
    torque_ft_lbs: string | null;
    fuel_type: string | null;
    drive_type: string | null;
    transmission: string | null;
    body_type: string | null;
    epa_combined_mpg: string | null;
    epa_city_highway_mpg: string | null;
    curb_weight_lbs: string | null;
    length_in: string | null;
    width_in: string | null;
    height_in: string | null;
  };
  full_data: Record<string, string | null>;
}

export async function decodeVin(vin: string): Promise<DecodedVehicle | null> {
  try {
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinExtended/${vin}?format=json`);
    
    if (!response.ok) {
      console.error('NHTSA API failed:', response.statusText);
      return null;
    }

    const data = await response.json();
    const results: NHTSAResult[] = data.Results;

    // Check for errors
    const hasError = results.some((r) => r.ErrorCode && r.ErrorCode !== '0' && r.ErrorCode !== '');
    // NHTSA sometimes returns error code '0' for success, or empty string. 
    // Additional Error Text might be present but we often ignore it if Make/Model are found.
    
    // Helper to get value
    const getValue = (variable: string) => results.find((r) => r.Variable === variable)?.Value || null;

    const make = getValue('Make');
    const model = getValue('Model');
    const yearStr = getValue('Model Year');

    // Basic validation: if we don't have Make, Model, Year, it's a bad decode
    if (!make || !model || !yearStr) {
      return null;
    }

    const year = parseInt(yearStr, 10);
    const trim = getValue('Trim');

    const specs = {
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
      length_in: getValue('Overall Length (inches)'), // Note: Variable name might differ, checking common ones
      width_in: getValue('Overall Width (inches)'),
      height_in: getValue('Overall Height (inches)'),
    };
    
    // Also capture specific variables if the generic names above failed or need specific IDs
    // For dimensions, NHTSA often has "Overall Length (inches)" etc.

    const full_data = results.reduce((acc, curr) => {
      if (curr.Value && curr.Value !== 'Not Applicable' && curr.Variable) {
        const key = curr.Variable.replace(/ /g, '_').toLowerCase();
        acc[key] = curr.Value;
      }
      return acc;
    }, {} as Record<string, string | null>);

    return {
      make,
      model,
      year,
      trim,
      specs,
      full_data,
    };

  } catch (error) {
    console.error('Error decoding VIN:', error);
    return null;
  }
}
