-- Migration: 010_add_shipping_to_profiles.sql
-- Add shipping and contact information to profiles

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS shipping_address JSONB;

-- shipping_address structure:
-- {
--   "line1": "123 Main St",
--   "line2": "Apt 4B",
--   "city": "New York",
--   "state": "NY",
--   "postalCode": "10001",
--   "country": "US"
-- }

COMMENT ON COLUMN profiles.phone IS 'Customer phone number for order contact';
COMMENT ON COLUMN profiles.shipping_address IS 'Default shipping address (JSONB)';
