import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables are not configured.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

type FilterOptionsResponse = {
  years: number[];
  makes: string[];
  models: { make: string; model: string }[];
  engineTypes: string[];
  fuelTypes: string[];
  drivetrains: string[];
  bodyTypes: string[];
};

// ... (keep existing code)

const response: FilterOptionsResponse = {
  years: sanitizeYears(Array.isArray(data.years) ? data.years : []),
  makes: sanitizeStrings(Array.isArray(data.makes) ? data.makes : []),
  // Pass models through directly as they are now objects
  models: Array.isArray(data.models) ? data.models : [],
  engineTypes: sanitizeStrings(Array.isArray(data.engineTypes) ? data.engineTypes : []),
  fuelTypes: sanitizeStrings(Array.isArray(data.fuelTypes) ? data.fuelTypes : []),
  drivetrains: sanitizeStrings(Array.isArray(data.drivetrains) ? data.drivetrains : []),
  bodyTypes: sanitizeStrings(Array.isArray(data.bodyTypes) ? data.bodyTypes : []),
};

cachedFilters = response;
cachedAt = now;

return NextResponse.json(response, {
  headers: {
    ...CACHE_HEADERS,
    'X-Explore-Filters-Cache': 'MISS',
  },
});
  } catch (error) {
  console.error('Unexpected error fetching filter options', error);

  if (cachedFilters) {
    return NextResponse.json(cachedFilters, {
      headers: {
        ...CACHE_HEADERS,
        'X-Explore-Filters-Cache': 'STALE',
      },
    });
  }

  return NextResponse.json(emptyResponse, { status: 503 });
}
}
