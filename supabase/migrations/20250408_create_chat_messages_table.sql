-- Create messages table
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references auth.users(id) on delete set null, -- Set null if sender is deleted
  receiver_id uuid references auth.users(id) on delete set null, -- Set null if receiver is deleted
  message_text text check (char_length(message_text) > 0), -- Ensure message is not empty
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for performance
create index idx_messages_sender_id on public.messages(sender_id);
create index idx_messages_receiver_id on public.messages(receiver_id);
create index idx_messages_created_at on public.messages(created_at desc);

-- Enable RLS
alter table public.messages enable row level security;

-- Allow users to see messages they sent or received
create policy "Users can view their own messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Allow users to insert messages where they are the sender
create policy "Users can insert their own messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

-- Allow admins to view all messages (optional, adjust based on privacy needs)
-- Consider if admins should only see messages where they are sender/receiver
create policy "Admins can view all messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Enable Realtime for the messages table
-- (Handled via Supabase dashboard or replication settings, but noted here)
-- alter publication supabase_realtime add table public.messages;

-- Trigger for updated_at (Not strictly needed for messages, but good practice if updates were allowed)
-- create trigger handle_updated_at before update on public.messages
--  for each row execute procedure moddatetime (updated_at); 
-- Note: Messages are typically immutable, so an updated_at trigger might not be necessary.
