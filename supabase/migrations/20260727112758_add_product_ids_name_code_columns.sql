/*
# Add product_ids, product_name, product_code columns to work_orders

## Why
The completion flow (`completeOrder`) writes `product_ids`, `product_name`, and `product_code`
to the `work_orders` table, but those columns do not exist. The Supabase update therefore
errors out silently and falls through to localStorage — so the `status = 'completed'`
change never persists in the database. After a refresh, `fetchWorkOrders` re-reads from
the database and the order reverts to its previous status (pending / in_progress),
which is the "stuck in pending / start work" bug the user is seeing.

## Changes
- `work_orders.product_ids` (jsonb, default '[]') — array of product UUIDs selected on completion.
- `work_orders.product_name` (text) — denormalized display name(s) of the product(s).
- `work_orders.product_code` (text) — denormalized display code(s) of the product(s).

## Security
- No RLS / policy changes. Existing anon + authenticated CRUD policies cover the new columns.

## Notes
1. Idempotent — uses `IF NOT EXISTS` so re-running is safe.
2. No data is lost; existing rows get the column defaults.
*/

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS product_ids jsonb DEFAULT '[]'::jsonb;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS product_name text;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS product_code text;