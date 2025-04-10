-- Add a status column to the profiles table
alter table public.profiles
add column status text default 'active' not null;

-- Add constraint to ensure status is either 'active' or 'banned'
alter table public.profiles
add constraint profiles_status_check check (status in ('active', 'banned'));

-- Optional: Update existing rows to have the default status if needed (usually default handles this)
-- update public.profiles set status = 'active' where status is null;

-- Update RLS policies if necessary to allow admins to update status
-- (Assuming existing admin update policy covers this new column)

-- Example: If a specific policy is needed for status update by admins:
/*
create policy "Admins can update profile status"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );
*/

-- Note: Ensure your existing admin update policy allows modifying the 'status' column.
-- If not, you might need to alter the existing policy or add a specific one like the example above.
