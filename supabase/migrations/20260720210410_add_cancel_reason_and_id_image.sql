/*
# Add cancel_reason and id_image_url columns to work_orders

1. New Columns
- work_orders.cancel_reason (text) — mandatory reason when an order is cancelled
- work_orders.id_image_url (text) — base64 data URL of the client's ID image
2. Security
- RLS already enabled; existing anon+authenticated CRUD policies cover the new columns.
*/

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS cancel_reason text;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS id_image_url text;
