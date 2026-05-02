-- Migration: 008_storage_bucket.sql
-- Create the product-images public storage bucket with size and MIME type limits

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------
-- Storage RLS policies
-- -----------------------------------------------------------------------

-- Public read access (bucket is public, but explicit policy for clarity)
CREATE POLICY "public read product images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

-- Store owner can upload
CREATE POLICY "owner upload product images" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'store_owner'
    )
  );

-- Store owner can delete
CREATE POLICY "owner delete product images" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'store_owner'
    )
  );
