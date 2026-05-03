-- Migration: 011_add_customer_info_to_orders.sql
-- Add customer name and phone to orders table

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

COMMENT ON COLUMN orders.customer_name IS 'Customer full name from shipping form';
COMMENT ON COLUMN orders.customer_phone IS 'Customer phone number from shipping form';
