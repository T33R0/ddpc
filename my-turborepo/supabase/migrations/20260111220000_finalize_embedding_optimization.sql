-- 1. Drop the RAM-hogging index immediately
DROP INDEX IF EXISTS public.vehicle_description_embedding_idx;

-- 2. Drop the old search function signatures (to avoid ambiguity or stale 1536 version)
-- We drop both the one we created recently and any potential legacy ones
DROP FUNCTION IF EXISTS public.search_vehicle_ids(vector, float, int);
DROP FUNCTION IF EXISTS public.match_vehicles(vector, float, int);
DROP FUNCTION IF EXISTS public.match_vehicles(vector, float, int, jsonb);

-- 3. Drop the old heavy column
ALTER TABLE public.vehicle_data 
DROP COLUMN IF EXISTS description_embedding;

-- 4. Rename the new column to the standard name
ALTER TABLE public.vehicle_data 
RENAME COLUMN description_embedding_512 TO description_embedding;

-- 5. Create the new Search Function (512 dimensions)
-- Note: Returning 'id text' to support non-UUID ids (VINs etc) which previously caused crashes.
CREATE OR REPLACE FUNCTION public.search_vehicle_ids(
  query_embedding vector(512), 
  match_threshold float, 
  match_count int
)
RETURNS TABLE (
  id text,
  similarity float
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vehicle_data.id,
    1 - (vehicle_data.description_embedding <=> query_embedding) AS similarity
  FROM vehicle_data
  WHERE 1 - (vehicle_data.description_embedding <=> query_embedding) > match_threshold
  ORDER BY vehicle_data.description_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 6. Create the new lightweight index
-- Using IVFFlat with lists=100 (good for <100k rows)
CREATE INDEX vehicle_description_embedding_idx 
ON public.vehicle_data 
USING ivfflat (description_embedding vector_cosine_ops)
WITH (lists = 100);
