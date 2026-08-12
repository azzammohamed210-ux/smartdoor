/*
# Create cash_collections table for technician cash collection tracking

1. Purpose
   - Tracks when an admin marks a technician's daily cash collection as "collected".
   - Each row represents one collection event for a specific technician on a specific date.
   - The `collected` boolean and `amount` field persist across sessions so the UI state survives reloads.

2. New Tables
   - `cash_collections`
     - `id` (uuid, primary key)
     - `technician_id` (uuid, references technicians(id) on delete cascade)
     - `order_id` (uuid, references work_orders(id) on delete cascade) — which order was collected
     - `amount` (numeric, not null) — cash amount collected
     - `collected` (boolean, default true) — whether this collection is marked as done
     - `collected_at` (timestamptz, default now()) — when collection was marked
     - `collection_date` (date, not null) — the business date the collection belongs to
     - `created_at` (timestamptz, default now())

3. Security
   - Enable RLS on `cash_collections`.
   - This app uses the anon-key client (no Supabase Auth sign-in), so policies are `TO anon, authenticated` with `USING (true)` because the data is intentionally shared among all operators of the app.
   - 4 separate policies for SELECT / INSERT / UPDATE / DELETE.

4. Notes
   - `collection_date` is a `date` type (not timestamptz) so filtering by day is straightforward.
   - `order_id` is optional in the application layer but the column is NOT NULL here; the app will always pass the order id when marking collection.
*/

CREATE TABLE IF NOT EXISTS cash_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  amount numeric(12,3) NOT NULL DEFAULT 0,
  collected boolean NOT NULL DEFAULT true,
  collected_at timestamptz DEFAULT now(),
  collection_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cash_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cash_collections" ON cash_collections;
CREATE POLICY "anon_select_cash_collections" ON cash_collections FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cash_collections" ON cash_collections;
CREATE POLICY "anon_insert_cash_collections" ON cash_collections FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cash_collections" ON cash_collections;
CREATE POLICY "anon_update_cash_collections" ON cash_collections FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cash_collections" ON cash_collections;
CREATE POLICY "anon_delete_cash_collections" ON cash_collections FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_cash_collections_tech_date ON cash_collections(technician_id, collection_date);
CREATE INDEX IF NOT EXISTS idx_cash_collections_order ON cash_collections(order_id);
