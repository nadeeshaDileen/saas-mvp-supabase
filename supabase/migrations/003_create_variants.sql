-- Migration: 003_create_variants.sql
-- Variants table: size/color combinations per product with stock tracking

CREATE TABLE IF NOT EXISTS variants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  size           TEXT NOT NULL CHECK (size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  color          TEXT NOT NULL CHECK (char_length(color) > 0),
  price_override NUMERIC(10,2) CHECK (price_override > 0),
  stock          INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, size, color)
);

CREATE INDEX IF NOT EXISTS idx_variants_product_id ON variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_stock      ON variants(stock);
