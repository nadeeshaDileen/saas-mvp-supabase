-- Migration: 002_create_products.sql
-- Products table with full-text search vector and indexes

CREATE TABLE IF NOT EXISTS products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  slug        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 2000),
  base_price  NUMERIC(10,2) NOT NULL CHECK (base_price > 0),
  category    TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'active', 'archived')),
  images      JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Full-text search generated column
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_vector TSVECTOR
    GENERATED ALWAYS AS (
      to_tsvector('english', name || ' ' || description)
    ) STORED;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_status     ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_search     ON products USING GIN(search_vector);
