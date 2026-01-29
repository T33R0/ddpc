-- Add a temporary column to store the new 512-dimensional embeddings
-- This allows us to reindex without losing data or hitting column type errors
-- Once populated, we will swap this with the main timestamp

ALTER TABLE vehicle_data 
ADD COLUMN IF NOT EXISTS description_embedding_512 vector(512);
