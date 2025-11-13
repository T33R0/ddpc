import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cache the response for 1 hour (3600 seconds)
// This prevents the expensive database query from running on every request
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  // Create an admin client with service role key to bypass RLS
  // This is safe because we're only reading public filter data
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  // Create client inside the request handler (not globally)
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
  
  try {
    // Use the SQL function to get comprehensive filter options
    // This query can be slow on large datasets, hence the caching above
    const { data, error } = await supabase.rpc('get_vehicle_filter_options');

    if (error) {
      console.error('Error fetching filter options:', error);
      
      // Check for timeout errors
      const errorMessage = error.message || 'Unknown error';
      const isTimeout = errorMessage.includes('timeout') || 
                       errorMessage.includes('canceling statement') ||
                       errorMessage.includes('statement timeout');
      
      // Return empty filter options on timeout so UI doesn't break
      // The user can still use the search functionality
      if (isTimeout) {
        console.warn('Filter options query timed out, returning empty options');
        return NextResponse.json({
          years: [],
          makes: [],
          models: [],
          engineTypes: [],
          fuelTypes: [],
          drivetrains: [],
          bodyTypes: [],
        }, {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          },
        });
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 },
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (e: any) {
    console.error('Unexpected error in filters route:', e);
    
    // Return empty filter options on any unexpected error
    return NextResponse.json({
      years: [],
      makes: [],
      models: [],
      engineTypes: [],
      fuelTypes: [],
      drivetrains: [],
      bodyTypes: [],
    }, {
      status: 200, // Return 200 so UI doesn't break
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  }
}
