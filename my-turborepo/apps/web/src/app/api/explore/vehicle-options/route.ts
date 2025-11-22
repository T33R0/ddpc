import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'makes' or 'models'
  const year = searchParams.get('year');
  const make = searchParams.get('make');

  try {
    if (type === 'makes' && year) {
      // Get makes for a specific year
      const { data, error } = await supabase
        .from('vehicle_data')
        .select('make')
        .eq('year', parseInt(year))
        .not('make', 'is', null);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Get unique makes and sort them
      const uniqueMakes = [...new Set(data?.map(item => item.make) || [])].sort();
      return NextResponse.json(uniqueMakes);

    } else if (type === 'models' && year && make) {
      // Get models for a specific year and make
      const { data, error } = await supabase
        .from('vehicle_data')
        .select('model')
        .eq('year', parseInt(year))
        .eq('make', make)
        .not('model', 'is', null);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Get unique models and sort them
      const uniqueModels = [...new Set(data?.map(item => item.model) || [])].sort();
      return NextResponse.json(uniqueModels);

    } else {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching vehicle options:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
