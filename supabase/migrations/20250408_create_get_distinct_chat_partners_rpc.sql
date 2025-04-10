-- Function to get distinct user IDs the admin has chatted with
create or replace function public.get_distinct_chat_partners(admin_id uuid)
returns table(partner_id uuid)
language sql
security definer -- Important for accessing messages table across users
as $$
  select distinct partner
  from (
    select receiver_id as partner
    from public.messages
    where sender_id = admin_id
    union -- Use UNION to combine distinct IDs from both sender and receiver perspectives
    select sender_id as partner
    from public.messages
    where receiver_id = admin_id
  ) as partners
  where partner != admin_id; -- Exclude the admin themselves
$$;

-- Grant execute permission to authenticated users (or specific roles if needed)
grant execute on function public.get_distinct_chat_partners(uuid) to authenticated;
-- If you want only admins to call this:
-- grant execute on function public.get_distinct_chat_partners(uuid) to service_role; -- Or a custom admin role
