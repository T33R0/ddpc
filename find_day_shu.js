require('dotenv').config({ path: 'apps/web/.env.local' });

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Missing env vars');
    return;
  }

  try {
    const res = await fetch(`${url}/rest/v1/user_vehicle?select=id,nickname`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    const data = await res.json();
    const dayShu = data.find(v => v.nickname && v.nickname.toLowerCase() === 'day_shu' || v.nickname && v.nickname.includes('day'));

    console.log("All vehicles:", data.map(v => v.nickname));
    console.log("Found:", dayShu);

    if (dayShu) {
      // Find its maintenance_logs
      const logRes = await fetch(`${url}/rest/v1/maintenance_log?user_vehicle_id=eq.${dayShu.id}&select=*,job_plans(*,job_steps(*)),service_items(*)`, {
        method: 'GET',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      console.log("Logs:", JSON.stringify(await logRes.json(), null, 2));
    }
  } catch (e) {
    console.error(e);
  }
}

run();
