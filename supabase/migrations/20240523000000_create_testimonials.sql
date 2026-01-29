-- Create testimonials table
create table if not exists testimonials (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  display_name text not null,
  role text not null,
  content text not null,
  avatar_url text,
  is_approved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table testimonials enable row level security;

-- Policies

-- Anyone can read approved testimonials
create policy "Approved testimonials are viewable by everyone"
  on testimonials for select
  using (is_approved = true);

-- Authenticated users can insert their own testimonials
create policy "Users can insert their own testimonials"
  on testimonials for insert
  with check (auth.uid() = user_id);

-- Users can read their own testimonials (even if not approved)
create policy "Users can view their own testimonials"
  on testimonials for select
  using (auth.uid() = user_id);

-- Admins can view/update all testimonials
create policy "Admins can do everything with testimonials"
  on testimonials for all
  using (
    exists (
      select 1 from user_profile
      where user_profile.user_id = auth.uid()
      and user_profile.role = 'admin'
    )
  );
