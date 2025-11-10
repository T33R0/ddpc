import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Note: Using the service_role key to bypass RLS for this public-facing but internal route.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const revalidate = 3600 // Revalidate every hour

export async function GET() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('CRITICAL: Supabase server environment variables are not configured.');
    return new NextResponse(
      JSON.stringify({ error: 'Server configuration error.' }),
      { status: 500 }
    );
  }

  // Create a new client for each server-side request
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { data, error } = await supabase.rpc('get_vehicle_filter_options')

    if (error) {
      console.error('Supabase RPC Error:', JSON.stringify(error, null, 2));
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch filter options from database.' }),
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (e: any) {
    console.error('An unexpected error occurred in filters route:', e);
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected internal server error occurred', details: e.message }),
      { status: 500 }
    )
  }
}
