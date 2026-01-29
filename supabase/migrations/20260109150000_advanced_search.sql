-- 1. Random Vehicle Selection
-- Efficiently selects random vehicles using random() sort
-- Note: For very large tables (>1M), TABLESAMPLE is better, but for 73k, this is fast enough.
create or replace function get_random_vehicles(limit_val int)
returns setof vehicle_data
language sql
as $$
  select * from vehicle_data
  order by random()
  limit limit_val;
$$;

-- 2. Advanced Semantic Search with Filters
-- Drop old signature to allow change
drop function if exists match_vehicles(vector(1536), float, int);
drop function if exists match_vehicles(vector(1536), float, int, jsonb);

create or replace function match_vehicles (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filters jsonb default '{}'::jsonb
)
returns table (
  id text,
  make text,
  model text,
  year text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    vehicle_data.id,
    vehicle_data.make,
    vehicle_data.model,
    vehicle_data.year,
    1 - (vehicle_data.description_embedding <=> query_embedding) as similarity
  from vehicle_data
  where 1 - (vehicle_data.description_embedding <=> query_embedding) > match_threshold
  -- Apply Hard Filters from JSONB
  -- Year Min
  and (
      (filters->>'year_min' is null) or 
      ((vehicle_data.year ~ '^\d+$') and (vehicle_data.year)::int >= (filters->>'year_min')::int)
  )
  -- Year Max
  and (
      (filters->>'year_max' is null) or 
      ((vehicle_data.year ~ '^\d+$') and (vehicle_data.year)::int <= (filters->>'year_max')::int)
  )
  -- Make (Case insensitive)
  and (
      (filters->>'make' is null) or 
      (vehicle_data.make ilike (filters->>'make'))
  )
  -- Model (Case insensitive + partial)
  and (
      (filters->>'model' is null) or 
      (vehicle_data.model ilike ('%' || (filters->>'model') || '%'))
  )
  -- Price Max (Try to parse base_msrp "$45,000")
  -- We strip non-numeric chars except dot
  and (
      (filters->>'price_max' is null) or 
      (
        vehicle_data.base_msrp is not null and
        regexp_replace(vehicle_data.base_msrp, '[^0-9.]', '', 'g') ~ '^[0-9.]+$' and
        (regexp_replace(vehicle_data.base_msrp, '[^0-9.]', '', 'g')::numeric <= (filters->>'price_max')::numeric)
      )
  )
  
  order by vehicle_data.description_embedding <=> query_embedding
  limit match_count;
end;
$$;
