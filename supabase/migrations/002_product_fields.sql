-- Add highlights and rich_description to products
-- Run in Supabase SQL Editor

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS highlights      text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rich_description jsonb   NOT NULL DEFAULT '[]';

-- To make yourself admin, first find your user UUID in
-- Supabase Dashboard > Authentication > Users, then run:
-- INSERT INTO admin_users (id) VALUES ('YOUR-USER-UUID-HERE')
-- ON CONFLICT DO NOTHING;
