const dotenv = require('dotenv');
dotenv.config({ path: 'apps/web/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTrims() {
  const { data, error } = await supabase
    .from('vehicle_data')
    .select('id, year, make, model, trim, engine_size_l, cylinders, trim_description')
    .eq('year', 2018)
    .eq('make', 'Ford')
    .eq('model', 'F-150');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Found vehicles:', JSON.stringify(data, null, 2));
}

checkTrims();
