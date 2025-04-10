-- Add a role column to the profiles table if it doesn't exist
alter table public.profiles
add column if not exists role text default 'user' not null;

-- Add constraint to ensure role is one of the expected values (e.g., 'user', 'admin')
-- Adjust the values as needed for your application
alter table public.profiles
add constraint profiles_role_check check (role in ('user', 'admin'));

-- Optional: Update existing admin users if needed
-- Example: Update a specific user to be an admin
-- update public.profiles set role = 'admin' where id = 'YOUR_ADMIN_USER_ID'; 
-- Replace 'YOUR_ADMIN_USER_ID' with the actual ID of your admin user.

-- Ensure RLS policies allow users to view their own role and admins to view/update roles if necessary.
-- The existing policies might already cover this, but review them.

-- Example policy allowing users to view their own profile (including role):
-- create policy "Users can view their own profile"
--   on public.profiles for select
--   using (auth.uid() = id);

-- Example policy allowing admins to update roles:
-- create policy "Admins can update profile roles"
--   on public.profiles for update
--   using (
--     exists (
--       select 1 from public.profiles p
--       where p.id = auth.uid()
--       and p.role = 'admin'
--     )
--   )
--   with check (
--     exists (
--       select 1 from public.profiles p
--       where p.id = auth.uid()
--       and p.role = 'admin'
--     )
--     -- Optional: Add constraints on which roles can be set
--     -- and (new.role in ('user', 'admin')) 
--   );
