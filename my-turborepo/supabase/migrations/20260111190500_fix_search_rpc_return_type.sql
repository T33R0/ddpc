drop function if exists search_vehicle_ids(vector(1536), float, int);

create or replace function search_vehicle_ids(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id text,
  similarity float
)
language plpgsql
security invoker
as $$
begin
  return query
  select
    vehicle_data.id,
    1 - (vehicle_data.description_embedding <=> query_embedding) as similarity
  from
    vehicle_data
  where
    1 - (vehicle_data.description_embedding <=> query_embedding) > match_threshold
  order by
    vehicle_data.description_embedding <=> query_embedding
  limit match_count;
end;
$$;
