-- Create favorites table
create table public.favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  property_id uuid references public.properties(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Ensure a user cannot favorite the same property multiple times
  constraint unique_user_property unique (user_id, property_id) 
);

-- Add indexes for performance
create index idx_favorites_user_id on public.favorites(user_id);
create index idx_favorites_property_id on public.favorites(property_id);

-- Enable Row Level Security (RLS)
alter table public.favorites enable row level security;

-- Policy: Allow users to view their own favorites
create policy "Users can view their own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

-- Policy: Allow users to insert their own favorites
create policy "Users can insert their own favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

-- Policy: Allow users to delete their own favorites
create policy "Users can delete their own favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

-- Optional Policy: Allow admins to view all favorites (Uncomment if needed)
-- create policy "Admins can view all favorites"
--   on public.favorites for select
--   using (
--     exists (
--       select 1 from public.profiles
--       where profiles.id = auth.uid()
--       and profiles.role = 'admin'
--     )
--   );

-- Optional Policy: Allow admins to delete any favorite (Uncomment if needed)
-- create policy "Admins can delete any favorite"
--   on public.favorites for delete
--   using (
--     exists (
--       select 1 from public.profiles
--       where profiles.id = auth.uid()
--       and profiles.role = 'admin'
--     )
--   );

-- Enable realtime for favorites table
alter publication supabase_realtime add table public.favorites;
