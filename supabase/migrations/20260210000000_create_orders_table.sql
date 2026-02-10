create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  vehicle_id uuid references user_vehicle(id), -- Optional: Link to vehicle for easier querying
  vendor text not null, -- e.g. "Summit Racing", "RockAuto"
  order_number text, -- e.g. "SUM-123456"
  order_date timestamptz default now(),
  status text check (status in ('ordered', 'shipped', 'delivered', 'cancelled')) default 'ordered',
  
  -- Financials
  subtotal numeric(10, 2) default 0, -- Sum of parts prices
  tax numeric(10, 2) default 0,
  shipping_cost numeric(10, 2) default 0,
  total numeric(10, 2) default 0,
  
  -- Tracking
  tracking_number text,
  carrier text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS Policies for orders
alter table orders enable row level security;

create policy "Users can view their own orders"
  on orders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own orders"
  on orders for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own orders"
  on orders for update
  using (auth.uid() = user_id);

create policy "Users can delete their own orders"
  on orders for delete
  using (auth.uid() = user_id);


-- Add order_id to inventory
alter table inventory 
add column if not exists order_id uuid references orders(id) on delete set null;

-- Add index for performance
create index if not exists idx_inventory_order_id on inventory(order_id);
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_orders_vehicle_id on orders(vehicle_id);
