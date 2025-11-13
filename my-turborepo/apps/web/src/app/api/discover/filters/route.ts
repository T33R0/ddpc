import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cache the response for 1 hour (3600 seconds)
// This prevents the expensive database query from running on every request
// Temporarily disabled to debug filter options issue
export const revalidate = 0;

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
    console.log('Starting filter options query...');
    const startTime = Date.now();
    
    // Use the SQL function to get comprehensive filter options
    // This query can be slow on large datasets, hence the caching above
    const { data, error } = await supabase.rpc('get_vehicle_filter_options');
    
    const queryTime = Date.now() - startTime;
    console.log(`Filter options query completed in ${queryTime}ms`);

    if (error) {
      console.error('Error fetching filter options:', error);
      
      // Check for timeout errors specifically
      const errorMessage = error.message || 'Unknown error';
      const errorCode = (error as any)?.code;
      const isTimeout = errorMessage.includes('timeout') || 
                       errorMessage.includes('canceling statement') ||
                       errorMessage.includes('statement timeout') ||
                       errorCode === '57014'; // PostgreSQL timeout error code
      
      // Only return empty arrays on actual timeout - let other errors propagate
      if (isTimeout) {
        console.warn('Filter options query timed out (code:', errorCode, '), returning empty options as fallback');
        return NextResponse.json({
          years: [],
          makes: [],
          models: [],
          engineTypes: [],
          fuelTypes: [],
          drivetrains: [],
          bodyTypes: [],
        }, {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          },
        });
      }
      
      // For non-timeout errors, return proper error response
      console.error('Non-timeout error fetching filter options:', errorMessage);
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 },
      );
    }

    // Success - return the data
    if (!data) {
      console.warn('Filter options query returned null data');
      return NextResponse.json({
        years: [],
        makes: [],
        models: [],
        engineTypes: [],
        fuelTypes: [],
        drivetrains: [],
        bodyTypes: [],
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    }

    // Validate and log successful response for debugging
    const responseData = {
      years: Array.isArray(data.years) ? data.years : [],
      makes: Array.isArray(data.makes) ? data.makes : [],
      models: Array.isArray(data.models) ? data.models : [],
      engineTypes: Array.isArray(data.engineTypes) ? data.engineTypes : [],
      fuelTypes: Array.isArray(data.fuelTypes) ? data.fuelTypes : [],
      drivetrains: Array.isArray(data.drivetrains) ? data.drivetrains : [],
      bodyTypes: Array.isArray(data.bodyTypes) ? data.bodyTypes : [],
    };

    console.log('Filter options loaded successfully:', {
      years: responseData.years.length,
      makes: responseData.makes.length,
      models: responseData.models.length,
      engineTypes: responseData.engineTypes.length,
      fuelTypes: responseData.fuelTypes.length,
      drivetrains: responseData.drivetrains.length,
      bodyTypes: responseData.bodyTypes.length,
    });

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (e: any) {
    console.error('Unexpected error in filters route:', e);
    
    // Check if it's a timeout error in the catch block
    const errorMessage = e?.message || String(e);
    const isTimeout = errorMessage.includes('timeout') || 
                     errorMessage.includes('canceling statement') ||
                     errorMessage.includes('statement timeout');
    
    // Only return empty arrays on timeout, otherwise throw to be handled by Next.js
    if (isTimeout) {
      return NextResponse.json({
        years: [],
        makes: [],
        models: [],
        engineTypes: [],
        fuelTypes: [],
        drivetrains: [],
        bodyTypes: [],
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    }
    
    // Re-throw non-timeout errors so they're properly handled
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching filter options' },
      { status: 500 }
    );
  }
}
