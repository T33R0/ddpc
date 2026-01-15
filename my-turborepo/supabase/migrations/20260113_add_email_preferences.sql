-- Create email_channels table
create table if not exists public.email_channels (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for email_channels
alter table public.email_channels enable row level security;

-- Create policy to allow read access to authenticated users
create policy "Allow read access to authenticated users"
  on public.email_channels
  for select
  to authenticated
  using (true);

-- Create user_email_preferences table
create table if not exists public.user_email_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  channel_id uuid not null references public.email_channels(id) on delete cascade,
  is_subscribed boolean default true,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, channel_id)
);

-- Enable RLS for user_email_preferences
alter table public.user_email_preferences enable row level security;

-- Create policy to allow users to view their own preferences
create policy "Users can view their own preferences"
  on public.user_email_preferences
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Create policy to allow users to update their own preferences
create policy "Users can update their own preferences"
  on public.user_email_preferences
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own preferences update"
    on public.user_email_preferences
    for update
    to authenticated
    using (auth.uid() = user_id);


-- Seed data for "Weekly Build Log"
insert into public.email_channels (name, slug, description)
values ('Weekly Build Log', 'weekly-build-log', 'Updates on new features, fixes, and pro tips for ddpc.')
on conflict (slug) do nothing;
