import { createClient } from '@supabase/supabase-js';
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables are not set.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // This function could be triggered by a cron job
    const { data: vehicles, error: vehicleError } = await supabase
      .from('user_vehicle')
      .select('id, odometer, owner_id');

    if (vehicleError) throw vehicleError;

    const notifications = [];

    for (const vehicle of vehicles) {
      const { data: intervals, error: intervalError } = await supabase
        .from('Service_Intervals')
        .select('*');

      if (intervalError) throw intervalError;

      for (const interval of intervals) {
        const { data: lastLog, error: logError } = await supabase
          .from('Maintenance_Log')
          .select('event_date, odometer')
          .eq('user_vehicle_id', vehicle.id)
          .eq('service_interval_id', interval.id)
          .order('event_date', { ascending: false })
          .limit(1)
          .single();

        if (logError && logError.code !== 'PGRST116') { // Ignore 'not found' errors
          throw logError;
        }

        let isDue = false;
        let dueDate = null;
        let dueOdometer = null;

        // Date-based trigger
        if (interval.interval_months) {
          const nextDueDate = new Date(lastLog ? lastLog.event_date : vehicle.created_at);
          nextDueDate.setMonth(nextDueDate.getMonth() + interval.interval_months);
          if (new Date() >= nextDueDate) {
            isDue = true;
            dueDate = nextDueDate;
          }
        }

        // Odometer-based trigger
        if (interval.interval_miles && vehicle.odometer) {
          const nextDueOdometer = (lastLog?.odometer || 0) + interval.interval_miles;
          if (vehicle.odometer >= nextDueOdometer) {
            isDue = true;
            dueOdometer = nextDueOdometer;
          }
        }
        
        if (isDue) {
          notifications.push({
            user_id: vehicle.owner_id,
            vehicle_id: vehicle.id,
            interval_id: interval.id,
            message: `Vehicle service '${interval.name}' is due.`,
            due_date: dueDate,
            due_odometer: dueOdometer,
          });
        }
      }
    }

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
