/*
# Add video_url column to products table

1. Changes
- Added `video_url` (text, nullable) column to the `products` table.
  This stores a direct Supabase Storage URL pointing to an MP4 video file
  that explains how to use/install the product.
- The column is optional; products without a video simply have NULL.

2. Security
- No changes to RLS policies. The existing product policies already allow
  authenticated admins and technicians to read/update products.
*/

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS video_url text;
