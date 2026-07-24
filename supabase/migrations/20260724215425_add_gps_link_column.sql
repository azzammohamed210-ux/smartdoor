-- Add gps_link column to store the original Google Maps URL
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS gps_link text;
