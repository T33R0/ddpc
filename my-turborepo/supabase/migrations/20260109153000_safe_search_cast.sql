-- Helper for safe integer casting
create or replace function safe_cast_int(text_val text)
returns int
language sql
immutable
as $$
  select case 
    when text_val ~ '^\d+$' then text_val::int 
    else null 
  end;
$$;

-- Helper for safe price casting
create or replace function safe_cast_price(text_val text)
returns numeric
language sql
immutable
as $$
  select case 
    when text_val is null then null
    when regexp_replace(text_val, '[^0-9.]', '', 'g') ~ '^\d+(\.\d+)?$' 
    then regexp_replace(text_val, '[^0-9.]', '', 'g')::numeric
    else null
  end;
$$;


-- 2. Advanced Semantic Search with Filters (Safe Version)
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
  -- Apply Hard Filters using SAFE casting functions
  -- Year Min
  and (
      (filters->>'year_min' is null) or 
      (safe_cast_int(vehicle_data.year) >= (filters->>'year_min')::int)
  )
  -- Year Max
  and (
      (filters->>'year_max' is null) or 
      (safe_cast_int(vehicle_data.year) <= (filters->>'year_max')::int)
  )
  -- Make
  and (
      (filters->>'make' is null) or 
      (vehicle_data.make ilike (filters->>'make'))
  )
  -- Model
  and (
      (filters->>'model' is null) or 
      (vehicle_data.model ilike ('%' || (filters->>'model') || '%'))
  )
  -- Price Max
  and (
      (filters->>'price_max' is null) or 
      (safe_cast_price(vehicle_data.base_msrp) <= (filters->>'price_max')::numeric)
  )
  
  order by vehicle_data.description_embedding <=> query_embedding
  limit match_count;
end;
$$;
