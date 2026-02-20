require('dotenv').config({ path: 'apps/web/.env.local' });

const tables = [
  'job_plans',
  'job_steps',
  'maintenance_log',
  'maintenance_parts',
  'master_parts_list',
  'mod_categories',
  'mod_items',
  'mod_outcome',
  'mod_parts',
  'mod_plans',
  'mod_steps',
  'mods',
  'part_inventory',
  'service_categories',
  'service_intervals',
  'service_items',
  'vehicle_bom',
  'vehicle_installed_components',
  'wishlist_items'
];

async function checkCounts() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    console.error('Missing env vars');
    process.exit(1);
  }

  const results = {};
  for (const table of tables) {
    try {
      // Fetch with exact count instead of fetching all rows
      const res = await fetch(`${url}/rest/v1/${table}?select=*`, {
        method: 'HEAD',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Prefer': 'count=exact'
        }
      });
      
      const count = res.headers.get('content-range');
      if (res.ok && count) {
        // count format is "0-0/10" or "*/10"
        const total = count.split('/')[1];
        results[table] = parseInt(total, 10);
      } else {
        results[table] = 'Error or missing table';
      }
    } catch (err) {
      results[table] = err.message;
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

checkCounts();
