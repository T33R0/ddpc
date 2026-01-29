create table if not exists public.user_preferences (
  user_id uuid references auth.users not null primary key,
  history_filters jsonb default '["maintenance", "fuel", "modification", "mileage"]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_preferences enable row level security;

create policy "Users can view their own preferences"
  on public.user_preferences for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own preferences"
  on public.user_preferences for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own preferences"
  on public.user_preferences for update
  using ( auth.uid() = user_id );
