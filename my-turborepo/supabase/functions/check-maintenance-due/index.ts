import { createClient } from '@supabase/supabase-js';
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables are not set.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Call the optimized RPC function
    const { data: dueMaintenance, error } = await supabase
      .rpc('get_maintenance_due_vehicles');

    if (error) throw error;

    const notifications = dueMaintenance.map((item: any) => ({
      user_id: item.user_id,
      vehicle_id: item.vehicle_id,
      interval_id: item.interval_id,
      message: `Vehicle service '${item.interval_name}' is due.`,
      due_date: item.due_date,
      due_odometer: item.due_odometer,
    }));

    // Here you would insert the notifications into a 'notifications' table
    // For now, we'll just return them.
    if (notifications.length > 0) {
      // const { error: notificationError } = await supabase
      //   .from('notifications')
      //   .insert(notifications);
      // if (notificationError) throw notificationError;
    }

    return new Response(JSON.stringify({ success: true, notifications }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
