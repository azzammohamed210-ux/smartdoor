/*
# Customer Database & Automated Midnight Archiving

1. Schema Changes
- Add `archived` (boolean, default false) and `archived_at` (timestamptz, nullable) columns to `work_orders`.
  - `archived = false` means the order is active in the daily dispatch view.
  - `archived = true` means the order has been moved to the permanent Customer Database.
- Add index on `archived` for efficient filtering of active vs archived orders.
- Add index on `archived_at` for sorting archived records by archive date.

2. Archive Function
- `archive_completed_orders()` — a PL/pgSQL function that:
  - Sets `archived = true` and `archived_at = now()` for all orders with `status = 'completed'` AND `archived = false`.
  - Returns the count of archived orders (as text for Supabase RPC compatibility).
  - This is the permanent record: completed orders are never deleted, only flagged as archived.

3. Scheduled Job (pg_cron)
- Schedule `archive_completed_orders()` to run daily at midnight (00:00) server time using pg_cron.
  - Job name: 'midnight_archive_completed_orders'
  - Schedule: '0 0 * * *' (every day at 00:00)
  - The job is idempotent: re-running it only archives newly-completed orders.

4. Security
- No new tables created, so no new RLS policies needed.
- The existing work_orders RLS policies (anon + authenticated CRUD) cover the new columns automatically.

5. Important Notes
- The `archived` column defaults to `false`, so all existing orders remain active until the midnight job runs.
- The frontend will also run a client-side check on app load: if local time is past midnight and there are unarchived completed orders, it calls the RPC to archive them immediately (belt-and-suspenders approach for when the cron job hasn't run yet or the user opens the app before the scheduled time).
- Archived orders are NEVER deleted — they form the permanent Customer Database.
*/

-- Add archived columns to work_orders
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- Indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_work_orders_archived ON work_orders(archived);
CREATE INDEX IF NOT EXISTS idx_work_orders_archived_at ON work_orders(archived_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_orders_status_archived ON work_orders(status, archived);

-- Archive function: moves completed orders to the Customer Database
CREATE OR REPLACE FUNCTION archive_completed_orders()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  archived_count integer;
BEGIN
  UPDATE work_orders
  SET archived = true,
      archived_at = now()
  WHERE status = 'completed' AND archived = false;

  GET DIAGNOSTICS archived_count = ROW_COUNT;

  RETURN archived_count::text;
END;
$$;

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Schedule the midnight archive job (idempotent: drop first if exists)
DO $$
BEGIN
  -- Unschedule any existing job with this name
  PERFORM cron.unschedule('midnight_archive_completed_orders');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Schedule the job to run at midnight every day
SELECT cron.schedule(
  'midnight_archive_completed_orders',
  '0 0 * * *',
  $$SELECT archive_completed_orders();$$
);
