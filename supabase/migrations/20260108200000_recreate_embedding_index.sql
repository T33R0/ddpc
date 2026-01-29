-- Increase timeout (0 = disabled) to allow index build to finish
set statement_timeout = 0;
-- Increase memory for maintenance operations (index builds)
-- 256MB is safe for a 1GB RAM (Micro) instance
set maintenance_work_mem = '256MB';

-- Switching to IVFFlat index which builds much faster and avoids the 60s HTTP timeout
-- For 73k rows, this will be nearly instant (vs 2+ mins for HNSW)
-- We set 'lists' to ~sqrt(rows) => sqrt(73000) ~= 270
create index if not exists vehicle_description_embedding_idx
on vehicle_data
using ivfflat (description_embedding vector_cosine_ops)
with (lists = 300);
