import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create a public, anonymous Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or anonymous key')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const revalidate = 3600 // Revalidate every hour

export async function GET() {
  try {
    const { data, error } = await supabase.rpc('get_vehicle_filter_options')

    if (error) {
      console.error('Error fetching vehicle filter options:', error)
      return new NextResponse(
        JSON.stringify({ error: 'Failed to fetch filter options' }),
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (e) {
    console.error('An unexpected error occurred in filters route:', e)
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected internal server error occurred' }),
      { status: 500 }
    )
  }
}
