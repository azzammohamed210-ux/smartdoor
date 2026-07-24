/*
# Create admins table and enable real-time on key tables

1. New Tables
- `admins`
  - `id` (uuid, primary key)
  - `email` (text, unique, not null) — admin login email
  - `password` (text, not null) — admin login password (plaintext, matching existing app pattern)
  - `name` (text, not null) — display name
  - `active` (boolean, default true) — allows deactivating an admin
  - `created_at` (timestamptz, default now())

2. Seed Data
- Inserts the primary admin account (admin@smartdoor.test / SmartDoor@2026) so existing logins keep working.

3. Security
- Enables RLS on `admins`.
- Adds anon + authenticated CRUD policies (the app uses the anon key; no sign-in screen gates these reads).
- Note: password is stored in plaintext to match the existing technicians table pattern.

4. Real-time
- Enables Supabase real-time publication on `technicians`, `products`, and `work_orders` so the frontend can subscribe to INSERT/UPDATE/DELETE events and reflect backend changes instantly across all devices.
*/

CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_admins" ON admins;
CREATE POLICY "anon_select_admins" ON admins FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_admins" ON admins;
CREATE POLICY "anon_insert_admins" ON admins FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_admins" ON admins;
CREATE POLICY "anon_update_admins" ON admins FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_admins" ON admins;
CREATE POLICY "anon_delete_admins" ON admins FOR DELETE
  TO anon, authenticated USING (true);

-- Seed the primary admin if not already present
INSERT INTO admins (email, password, name, active)
VALUES ('admin@smartdoor.test', 'SmartDoor@2026', 'مدير النظام', true)
ON CONFLICT (email) DO NOTHING;

-- Enable real-time on the three key tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'technicians'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE technicians;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE products;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'work_orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE work_orders;
  END IF;
END $$;
