alter table inventory add column if not exists quantity integer default 1;
alter table inventory add column if not exists purchased_at timestamptz;
