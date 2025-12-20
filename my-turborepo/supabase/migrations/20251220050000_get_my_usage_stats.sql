-- Create a function to calculate usage statistics for the current user
-- Returns vehicle count and total storage used by vehicle images
create or replace function get_my_usage_stats()
returns table (
  vehicles_count bigint,
  storage_bytes bigint
)
language plpgsql
security definer
set search_path = public, storage, extensions
as $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  return query
  with user_vehicles as (
    select id from public.user_vehicle where owner_id = current_user_id
  )
  select
    (select count(*) from user_vehicles),
    coalesce((
      select sum((metadata->>'size')::bigint)
      from storage.objects
      where bucket_id = 'vehicles'
      -- Ensure the path matches the expected pattern vehicle-images/<uuid>/...
      -- Pattern: vehicle-images/ followed by UUID (36 chars) followed by / and anything
      and name ~ '^vehicle-images/[0-9a-fA-F-]{36}/.*$'
      -- Extract UUID and check if it belongs to the user's vehicles
      and (substring(name from '^vehicle-images/([0-9a-fA-F-]{36})/')::uuid) in (select id from user_vehicles)
    ), 0);
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function get_my_usage_stats() to authenticated;
