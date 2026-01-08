-- Create table for Ogma's self-improvement memory
create table if not exists ogma_improvements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  category text not null check (category in ('Correction', 'Strategy', 'Preference', 'Insight')),
  insight text not null,
  confidence_score integer not null check (confidence_score between 1 and 100),
  source_session_id uuid references ogma_chat_sessions(id) on delete set null
);

-- Enable RLS
alter table ogma_improvements enable row level security;

-- Policies
-- Authenticated users (admins generally) can read all improvements (or scope to own if desired, but Ogma knowledge is usually global or system-level)
-- For now, we assume Ogma improvements are system-wide knowledge, visible to authenticated users (admins).
create policy "Authenticated users can read improvements"
  on ogma_improvements for select
  to authenticated
  using (true);

-- Authenticated users (via Ogma actions) can insert improvements
create policy "Authenticated users can insert improvements"
  on ogma_improvements for insert
  to authenticated
  with check (true);

-- Add simple index for retrieval performance
create index if not exists idx_ogma_improvements_confidence_created
  on ogma_improvements(confidence_score desc, created_at desc);
