import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create a public, anonymous Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const revalidate = 3600 // Revalidate every hour

export async function GET() {
  console.log('Attempting to fetch vehicle filter options...');
  console.log('Supabase URL:', supabaseUrl ? 'Loaded' : 'MISSING');
  console.log('Supabase Anon Key:', supabaseAnonKey ? 'Loaded' : 'MISSING');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL: Supabase environment variables are not configured.');
    return new NextResponse(
      JSON.stringify({ error: 'Server configuration error.' }),
      { status: 500 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log('Supabase client created successfully.');

    const { data, error } = await supabase.rpc('get_vehicle_filter_options')

    if (error) {
      console.error('Supabase RPC Error:', JSON.stringify(error, null, 2));
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch filter options from database.' }),
        { status: 500 }
      )
    }

    console.log('Successfully fetched filter options.');
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('An unexpected error occurred in filters route:', e);
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected internal server error occurred', details: e.message }),
      { status: 500 }
    )
  }
}
