import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 3600; // Cache for 1 hour

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  // Use the SQL function to get comprehensive filter options
  const { data, error } = await supabase.rpc('get_vehicle_filter_options');

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}
