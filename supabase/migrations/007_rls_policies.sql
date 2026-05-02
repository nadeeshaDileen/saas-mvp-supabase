-- Migration: 007_rls_policies.sql
-- Enable RLS and create all Row Level Security policies

-- -----------------------------------------------------------------------
-- products
-- -----------------------------------------------------------------------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active products" ON products
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "owner full access products" ON products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'store_owner'
    )
  );

-- -----------------------------------------------------------------------
-- variants
-- -----------------------------------------------------------------------
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read variants" ON variants
  FOR SELECT
  USING (true);

CREATE POLICY "owner full access variants" ON variants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'store_owner'
    )
  );

-- -----------------------------------------------------------------------
-- cart_items
-- -----------------------------------------------------------------------
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own cart" ON cart_items
  FOR ALL
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------
-- orders
-- -----------------------------------------------------------------------
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own orders" ON orders
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "owner sees all orders" ON orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'store_owner'
    )
  );

-- -----------------------------------------------------------------------
-- order_items
-- -----------------------------------------------------------------------
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own order items" ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE id = order_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "owner sees all order items" ON order_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'store_owner'
    )
  );
