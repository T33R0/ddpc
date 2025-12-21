create table if not exists wishlist_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  vehicle_id uuid references user_vehicle(id) on delete cascade not null,
  name text not null,
  url text,
  price numeric,
  notes text,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  type text check (type in ('mod', 'service')) not null,
  category text,
  status text check (status in ('active', 'purchased')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table wishlist_items enable row level security;

create policy "Users can view their own wishlist items"
  on wishlist_items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own wishlist items"
  on wishlist_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own wishlist items"
  on wishlist_items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own wishlist items"
  on wishlist_items for delete
  using (auth.uid() = user_id);

-- Indexes
create index wishlist_items_vehicle_id_idx on wishlist_items(vehicle_id);
create index wishlist_items_user_id_idx on wishlist_items(user_id);
