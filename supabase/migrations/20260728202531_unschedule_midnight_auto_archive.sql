/*
# Unschedule automatic midnight archive of completed orders

## Why
The map view ("خرائط أوردؤات الفنيين") must show ALL active (non-archived)
work orders regardless of status — pending, in progress, completed, and
cancelled — and only remove them when the user explicitly archives them.

Previously a pg_cron job named 'midnight_archive_completed_orders' ran
`archive_completed_orders()` every night at 00:00 server time, automatically
marking every completed order as archived. That silently removed completed
orders from the active Work Orders list and from the map without any user
action, which contradicts the requirement that orders only leave the map
upon explicit archiving.

## Changes
1. Unschedule the 'midnight_archive_completed_orders' pg_cron job so
   completed orders are NO LONGER archived automatically.
2. Keep the `archive_completed_orders()` SQL function in place (it is still
   available for any future manual/explicit use), but it is no longer
   triggered on a schedule.
3. No table schema, column, or RLS policy changes — this is purely a
   scheduling change. No data is deleted or modified.

## Notes
- The manual "Archive Selected" action in the Dashboard continues to work
  exactly as before — it calls `archiveOrders(ids)` for the specific
  orders the user selected, which is the intended explicit path.
- This migration is idempotent: re-running it is safe because
  `cron.unschedule` tolerates a missing job.
*/

DO $$
BEGIN
  PERFORM cron.unschedule('midnight_archive_completed_orders');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
