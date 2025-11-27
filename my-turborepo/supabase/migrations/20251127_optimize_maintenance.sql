-- Function to check for vehicles with due maintenance
-- Returns a list of vehicles and the specific intervals that are due
create or replace function get_maintenance_due_vehicles()
returns table (
  user_id uuid,
  vehicle_id uuid,
  interval_id uuid,
  interval_name text,
  due_date timestamptz,
  due_odometer int4
)
language plpgsql
security definer
as $$
begin
  return query
  with latest_logs as (
    select distinct on (ml.user_vehicle_id, ml.service_interval_id)
      ml.user_vehicle_id,
      ml.service_interval_id,
      ml.event_date,
      ml.odometer
    from "Maintenance_Log" ml
    order by ml.user_vehicle_id, ml.service_interval_id, ml.event_date desc
  )
  select
    uv.owner_id as user_id,
    uv.id as vehicle_id,
    si.id as interval_id,
    si.name as interval_name,
    case
      when si.interval_months is not null then
        (coalesce(ll.event_date, uv.created_at) + (si.interval_months || ' months')::interval)
      else null
    end as due_date,
    case
      when si.interval_miles is not null then
        (coalesce(ll.odometer, 0) + si.interval_miles)
      else null
    end as due_odometer
  from "user_vehicle" uv
  join "Service_Intervals" si on true -- Cross join to check all intervals (or join on vehicle type if applicable)
  left join latest_logs ll on ll.user_vehicle_id = uv.id and ll.service_interval_id = si.id
  where
    -- Check Date-based due
    (
      si.interval_months is not null and
      now() >= (coalesce(ll.event_date, uv.created_at) + (si.interval_months || ' months')::interval)
    )
    OR
    -- Check Odometer-based due
    (
      si.interval_miles is not null and
      uv.odometer is not null and
      uv.odometer >= (coalesce(ll.odometer, 0) + si.interval_miles)
    );
end;
$$;
