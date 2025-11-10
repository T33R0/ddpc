import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const revalidate = 3600 // Revalidate every hour

export async function GET() {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

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
