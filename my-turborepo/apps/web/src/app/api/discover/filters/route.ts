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
      return NextResponse.json(
        { error: error.message },
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
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
