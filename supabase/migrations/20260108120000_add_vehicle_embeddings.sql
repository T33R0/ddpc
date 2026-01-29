-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Add a column to store the description embedding
-- The output of text-embedding-3-small is 1536 dimensions
alter table vehicle_data
add column if not exists description_embedding vector(1536);

-- Create an HNSW index for fast nearest neighbor search
create index if not exists vehicle_description_embedding_idx
on vehicle_data
using hnsw (description_embedding vector_cosine_ops);

-- Create a function to search for vehicles
drop function if exists match_vehicles(vector(1536), float, int);

create or replace function match_vehicles (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
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
  order by vehicle_data.description_embedding <=> query_embedding
  limit match_count;
end;
$$;
