require('dotenv').config({ path: 'apps/web/.env.local' });
const tables = ['jobs', 'inventory', 'job_parts', 'job_tasks', 'master_parts'];
async function check() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const results = {};
  for (const table of tables) {
    try {
      const res = await fetch(`${url}/rest/v1/${table}?select=*`, {
        method: 'HEAD',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Prefer': 'count=exact'
        }
      });
      if (res.ok) {
        results[table] = parseInt(res.headers.get('content-range').split('/')[1]);
      } else {
        results[table] = 'Error';
      }
    } catch (e) {
      results[table] = e.message;
    }
  }
  console.log(JSON.stringify(results, null, 2));
}
check();
