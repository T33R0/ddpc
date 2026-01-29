
-- Create the bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('admin-screenshots', 'admin-screenshots', true)
on conflict (id) do nothing;

-- Policy to allow authenticated users to upload
create policy "Authenticated users can upload admin screenshots"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'admin-screenshots' );

-- Policy to allow authenticated users to update/delete their uploads (optional, but good for retries)
create policy "Authenticated users can update admin screenshots"
on storage.objects for update
to authenticated
using ( bucket_id = 'admin-screenshots' );

-- Policy to allow public to view (since it's a reference tool, public read is usually easiest for img tags,
-- but restricted to authenticated is also fine. The prompt implies admin use, but images might need to be served.
-- "Public" bucket setting above handles the serving URL structure, but RLS is still checked.
create policy "Anyone can view admin screenshots"
on storage.objects for select
to public
using ( bucket_id = 'admin-screenshots' );
