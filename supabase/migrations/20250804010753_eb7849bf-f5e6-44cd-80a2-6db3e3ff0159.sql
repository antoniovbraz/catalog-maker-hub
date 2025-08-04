-- Criar políticas para o bucket product-images
-- Política para permitir que usuários vejam imagens de produtos do seu tenant
CREATE POLICY "Users can view product images from own tenant" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] = (
    SELECT tenant_id::text 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Política para permitir que usuários façam upload de imagens para seu tenant
CREATE POLICY "Users can upload product images to own tenant" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] = (
    SELECT tenant_id::text 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Política para permitir que usuários atualizem imagens do seu tenant
CREATE POLICY "Users can update product images from own tenant" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] = (
    SELECT tenant_id::text 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Política para permitir que usuários deletem imagens do seu tenant
CREATE POLICY "Users can delete product images from own tenant" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] = (
    SELECT tenant_id::text 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);