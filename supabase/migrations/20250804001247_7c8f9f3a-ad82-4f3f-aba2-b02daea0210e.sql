-- Criar tabela para imagens dos produtos
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  image_type TEXT CHECK (image_type IN ('product', 'package', 'specification', 'detail')) DEFAULT 'product',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  tenant_id UUID NOT NULL
);

-- Habilitar RLS
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Users can access own tenant product images" 
ON product_images 
FOR ALL 
USING (
  tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()) 
  OR get_current_user_role() = 'super_admin'::user_role
);

-- Criar bucket para armazenar imagens
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true);

-- Criar políticas para o storage bucket
CREATE POLICY "Anyone can view product images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Users can upload their own product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own product images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'product-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own product images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'product-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_product_images_updated_at
BEFORE UPDATE ON product_images
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();