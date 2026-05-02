-- Migration: 009_fix_cart_items_rls.sql
-- Fix cart_items RLS policy to allow authenticated users to insert their own cart items

-- Drop the existing policy
DROP POLICY IF EXISTS "users own cart" ON cart_items;

-- Create separate policies for better control
-- Allow users to SELECT their own cart items
CREATE POLICY "users select own cart" ON cart_items
  FOR SELECT
  USING (user_id = auth.uid());

-- Allow authenticated users to INSERT cart items (user_id will be set by trigger or application)
CREATE POLICY "users insert own cart" ON cart_items
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow users to UPDATE their own cart items
CREATE POLICY "users update own cart" ON cart_items
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow users to DELETE their own cart items
CREATE POLICY "users delete own cart" ON cart_items
  FOR DELETE
  USING (user_id = auth.uid());
