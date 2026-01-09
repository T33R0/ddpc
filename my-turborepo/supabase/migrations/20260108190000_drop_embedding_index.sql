-- Drop the expensive HNSW index to allow bulk updates
drop index if exists vehicle_description_embedding_idx;
