-- Enable the moddatetime extension if not already enabled
create extension if not exists moddatetime schema extensions;

-- Create settings table with key-value pairs
create table public.settings (
  key text primary key,
  value jsonb, -- Use jsonb to store various types of setting values
  description text, -- Optional description for clarity
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.settings enable row level security;

-- Allow admins to read all settings
create policy "Admins can read settings"
  on public.settings for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Allow admins to insert/update settings
create policy "Admins can insert/update settings"
  on public.settings for all -- Covers INSERT, UPDATE, DELETE
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  )
  with check (
     exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Trigger for updated_at
create trigger handle_updated_at before update on public.settings
  for each row execute procedure moddatetime (updated_at);

-- Insert initial default settings (admins can change these later)
insert into public.settings (key, value, description) values
  ('site_name', '"اسم الموقع الافتراضي"', 'The name displayed for the website'),
  ('contact_email', '"contact@example.com"', 'The primary contact email address')
on conflict (key) do nothing; -- Avoid error if settings already exist
