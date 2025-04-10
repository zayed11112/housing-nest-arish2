-- Add image_url column to messages table
alter table public.messages
add column image_url text null;

-- Update RLS policies if needed (existing policies likely cover this)
-- Ensure the insert policy allows sending null or a text value for image_url
-- Ensure the select policy allows reading the image_url
