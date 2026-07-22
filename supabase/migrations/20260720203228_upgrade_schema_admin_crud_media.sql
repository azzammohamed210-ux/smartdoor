/*
# Smart Door Oman - Schema Upgrade for Admin CRUD + Completion Media

1. New Columns
- products: price (numeric), total_stock (int), reorder_level moved to products
- technicians: password (text) — for mock auth admin management
- work_orders: route_number (int), receipt_image_url (text), final_photo_url (text), completion_log (text), client_location_name (text)
2. Data Migration
- Migrate inventory_items.quantity/reorder_level into products.total_stock/reorder_level
- Reseed product catalog with categories (lock/door) and prices
3. Security
- RLS already enabled; policies already allow anon+authenticated CRUD. No changes.
4. Notes
- inventory_items table remains for backward compat but app now reads stock from products directly.
*/

-- Add columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS price numeric(10,3) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS total_stock integer NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_level integer NOT NULL DEFAULT 5;

-- Add password to technicians (for admin-managed mock auth)
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS password text NOT NULL DEFAULT 'Tech@2026';

-- Add work order completion media + routing columns
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS route_number integer;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS receipt_image_url text;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS final_photo_url text;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS completion_log text;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS client_location_name text;

-- Migrate existing inventory quantities into products
UPDATE products p SET
  total_stock = COALESCE((SELECT i.quantity FROM inventory_items i WHERE i.product_id = p.id), 0),
  reorder_level = COALESCE((SELECT i.reorder_level FROM inventory_items i WHERE i.product_id = p.id), 5)
WHERE EXISTS (SELECT 1 FROM inventory_items i WHERE i.product_id = p.id);

-- Replace product catalog with proper categories + prices
DELETE FROM products;
INSERT INTO products (code, name_ar, category, price, total_stock, reorder_level) VALUES
  ('P-101', 'ماكينة لايف سلايد', 'door', 450.000, 12, 5),
  ('P-102', 'ماكينة لايف سوينج', 'door', 520.000, 8, 5),
  ('P-103', 'ماكينة دورمانا', 'door', 680.000, 6, 5),
  ('P-301', 'قفل سمارت VIP', 'lock', 320.000, 15, 5),
  ('P-302', 'قفل كهرومغناطيسي', 'lock', 180.000, 10, 5),
  ('P-303', 'قلم ريموت كنترول', 'lock', 45.000, 20, 5),
  ('P-304', 'حساس حركة', 'lock', 75.000, 4, 5),
  ('P-305', 'لوحة تحكم', 'lock', 220.000, 9, 5);

-- Ensure technicians have passwords
UPDATE technicians SET password = 'Tech@2026' WHERE password IS NULL OR password = '';
