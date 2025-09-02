-- Create product_images bucket if not exists
INSERT INTO storage.buckets (id, name, public)
SELECT 'product_images', 'product_images', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'product_images'
);

-- Policies for product_images bucket
DROP POLICY IF EXISTS "Public access to product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage own product images" ON storage.objects;

CREATE POLICY "Public access to product images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'product_images'
);

CREATE POLICY "Users can manage own product images"
ON storage.objects
FOR INSERT, UPDATE, DELETE
USING (
  bucket_id = 'product_images'
  AND (
    owner = auth.uid()
    OR owner = (auth.jwt()->>'tenant_id')::uuid
  )
)
WITH CHECK (
  bucket_id = 'product_images'
  AND (
    owner = auth.uid()
    OR owner = (auth.jwt()->>'tenant_id')::uuid
  )
);
