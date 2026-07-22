/*
# Smart Door Oman - Core Schema

1. New Tables
- `technicians` — pre-seeded technician profiles (name, email, phone, active)
- `work_orders` — service/installation orders with full lifecycle
- `products` — product catalog (door operators, locks, accessories)
- `inventory_items` — stock tracking per product
2. Security
- RLS enabled on all tables; anon+authenticated CRUD (single-tenant demo app with its own mock auth layer on top).
3. Seeding
- 3 technicians seeded by name.
- Product catalog seeded with common door operators.
*/

CREATE TABLE IF NOT EXISTS technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name_ar text NOT NULL,
  category text NOT NULL DEFAULT 'operator',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  technician_id uuid REFERENCES technicians(id) ON DELETE SET NULL,
  client_name text,
  client_phone text NOT NULL,
  gps_lat double precision,
  gps_lng double precision,
  status text NOT NULL DEFAULT 'pending',
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  amount numeric(10,3) DEFAULT 0,
  warranty_months integer DEFAULT 12,
  payment_method text DEFAULT 'cash',
  checklist jsonb DEFAULT '[]'::jsonb,
  notes text,
  invoice_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0,
  reorder_level integer NOT NULL DEFAULT 5,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_technicians" ON technicians;
CREATE POLICY "anon_crud_technicians" ON technicians FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_ins_technicians" ON technicians FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_upd_technicians" ON technicians FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_del_technicians" ON technicians FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_crud_products" ON products;
CREATE POLICY "anon_crud_products" ON products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_ins_products" ON products FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_upd_products" ON products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_del_products" ON products FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_crud_work_orders" ON work_orders;
CREATE POLICY "anon_crud_work_orders" ON work_orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_ins_work_orders" ON work_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_upd_work_orders" ON work_orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_del_work_orders" ON work_orders FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_crud_inventory" ON inventory_items;
CREATE POLICY "anon_crud_inventory" ON inventory_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_ins_inventory" ON inventory_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_upd_inventory" ON inventory_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_del_inventory" ON inventory_items FOR DELETE TO anon, authenticated USING (true);

-- Seed technicians
INSERT INTO technicians (name, email, phone)
VALUES
  ('محمد إيهاب محمد', 'tech1@smartdoor.test', '+96891234561'),
  ('احمد سامي عبد المنعم', 'tech2@smartdoor.test', '+96891234562'),
  ('باسم مصطفي', 'tech3@smartdoor.test', '+96891234563')
ON CONFLICT (email) DO NOTHING;

-- Seed product catalog
INSERT INTO products (code, name_ar, category) VALUES
  ('P-101', 'ماكينة لايف سلايد', 'operator'),
  ('P-102', 'ماكينة لايف سوينج', 'operator'),
  ('P-103', 'ماكينة دورمانا', 'operator'),
  ('P-201', 'قفل كهرومغناطيسي', 'lock'),
  ('P-202', 'قلم ريموت كنترول', 'accessory'),
  ('P-203', 'حساس حركة', 'accessory'),
  ('P-204', 'لوحة تحكم', 'accessory')
ON CONFLICT (code) DO NOTHING;

-- Seed inventory
INSERT INTO inventory_items (product_id, quantity, reorder_level)
SELECT p.id, 10, 5 FROM products p
WHERE NOT EXISTS (SELECT 1 FROM inventory_items i WHERE i.product_id = p.id);
