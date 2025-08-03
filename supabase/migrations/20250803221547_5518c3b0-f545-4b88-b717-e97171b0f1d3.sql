-- Criar ENUM para tipo de marketplace
CREATE TYPE marketplace_type AS ENUM ('platform', 'modality');

-- Adicionar novas colunas à tabela marketplaces
ALTER TABLE public.marketplaces 
ADD COLUMN marketplace_type marketplace_type DEFAULT 'modality',
ADD COLUMN category_restrictions jsonb DEFAULT '[]'::jsonb;

-- Renomear parent_marketplace_id para platform_id para maior clareza
ALTER TABLE public.marketplaces 
RENAME COLUMN parent_marketplace_id TO platform_id;

-- Atualizar dados existentes para definir tipos corretos
-- Marketplaces que são pais viram plataformas
UPDATE public.marketplaces 
SET marketplace_type = 'platform' 
WHERE platform_id IS NULL;

-- Modalidades específicas para categorias
-- Mercado Livre Livros só para categoria de livros
UPDATE public.marketplaces 
SET category_restrictions = '["livros", "books"]'::jsonb
WHERE name ILIKE '%livro%';

-- Adicionar constraint para garantir que plataformas não tenham platform_id
ALTER TABLE public.marketplaces 
ADD CONSTRAINT check_platform_no_parent 
CHECK (
  (marketplace_type = 'platform' AND platform_id IS NULL) OR 
  (marketplace_type = 'modality' AND platform_id IS NOT NULL)
);

-- Adicionar índices para performance
CREATE INDEX idx_marketplaces_type ON public.marketplaces(marketplace_type);
CREATE INDEX idx_marketplaces_platform_id ON public.marketplaces(platform_id);
CREATE INDEX idx_marketplaces_category_restrictions ON public.marketplaces USING GIN(category_restrictions);

-- Comentários para documentação
COMMENT ON COLUMN public.marketplaces.marketplace_type IS 'Tipo do marketplace: platform (ex: Mercado Livre) ou modality (ex: Mercado Livre Clássico)';
COMMENT ON COLUMN public.marketplaces.platform_id IS 'ID da plataforma pai para modalidades';
COMMENT ON COLUMN public.marketplaces.category_restrictions IS 'Array JSON de categorias que podem usar esta modalidade. Vazio = todas as categorias';