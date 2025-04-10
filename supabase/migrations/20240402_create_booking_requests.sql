-- Enable the moddatetime extension
create extension if not exists moddatetime schema extensions;

create type booking_status as enum ('pending', 'approved', 'rejected', 'cancelled');

-- Create properties table first
create table public.properties (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  location text not null,
  rooms integer not null,
  bathrooms integer not null default 1,
  size numeric not null default 0,
  beds integer not null default 1,
  price numeric not null,
  discount numeric default 0,
  property_type text not null,
  status text not null,
  amenities text[] default '{}',
  images text[] default '{}',
  description text,
  available boolean default true,
  residential_unit_type text,
  housing_category text,
  area_type text,
  special_property_type text default 'عادي',
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create trigger for updated_at
create trigger handle_updated_at_properties
  before update on public.properties
  for each row
  execute procedure moddatetime (updated_at);

-- Enable RLS
alter table public.properties enable row level security;

-- Policy for selecting properties (everyone can read)
create policy "Everyone can view properties"
  on public.properties for select
  using (true);

-- Policy for inserting properties (admin only)
create policy "Only admins can create properties"
  on public.properties for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Policy for updating properties (admin only)
create policy "Only admins can update properties"
  on public.properties for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Policy for deleting properties (admin only)
create policy "Only admins can delete properties"
  on public.properties for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Enable realtime for properties table
alter publication supabase_realtime add table public.properties;

create table public.booking_requests (
  id uuid default uuid_generate_v4() primary key,
  property_id uuid references public.properties(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  full_name text not null,
  faculty text not null,
  batch text not null,
  phone text not null,
  alternative_phone text,
  status booking_status default 'pending' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.booking_requests enable row level security;

-- Allow users to view their own booking requests
create policy "Users can view their own booking requests"
  on public.booking_requests for select
  using (auth.uid() = user_id);

-- Allow users to create booking requests
create policy "Users can create booking requests"
  on public.booking_requests for insert
  with check (auth.uid() = user_id);

-- Allow admins to view all booking requests
create policy "Admins can view all booking requests"
  on public.booking_requests for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Allow admins to update booking requests
create policy "Admins can update booking requests"
  on public.booking_requests for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Create trigger for updated_at
create trigger handle_updated_at before update on public.booking_requests
  for each row execute procedure moddatetime (updated_at);