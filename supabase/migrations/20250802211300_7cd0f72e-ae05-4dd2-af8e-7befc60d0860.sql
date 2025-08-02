-- Criar marketplace específico para Livros do Mercado Livre
INSERT INTO public.marketplaces (name, description, tenant_id)
SELECT 
  'Mercado Livre Livros' as name,
  'Marketplace específico para livros com taxas diferenciadas' as description,
  tenant_id
FROM public.marketplaces 
WHERE name = 'Mercado Livre Clássico'
LIMIT 1
ON CONFLICT (name, tenant_id) DO UPDATE SET
  description = EXCLUDED.description,
  updated_at = now();

-- Configurar comissões do Mercado Livre
-- Limpar comissões existentes do Mercado Livre
DELETE FROM public.commissions WHERE marketplace_id IN (
  SELECT id FROM public.marketplaces WHERE name ILIKE '%mercado%livre%'
);

-- Mercado Livre Clássico: 12% (média entre 10% e 14%)
INSERT INTO public.commissions (marketplace_id, category_id, rate, tenant_id)
SELECT 
  m.id as marketplace_id,
  NULL as category_id,
  0.12 as rate, -- 12% em decimal
  m.tenant_id
FROM public.marketplaces m 
WHERE m.name = 'Mercado Livre Clássico'
ON CONFLICT (marketplace_id, category_id) DO UPDATE SET
  rate = EXCLUDED.rate,
  updated_at = now();

-- Mercado Livre Premium: 17% (média entre 15% e 19%)
INSERT INTO public.commissions (marketplace_id, category_id, rate, tenant_id)
SELECT 
  m.id as marketplace_id,
  NULL as category_id,
  0.17 as rate, -- 17% em decimal
  m.tenant_id
FROM public.marketplaces m 
WHERE m.name = 'Mercado Livre Premium'
ON CONFLICT (marketplace_id, category_id) DO UPDATE SET
  rate = EXCLUDED.rate,
  updated_at = now();

-- Mercado Livre Livros: 12% (mesmo do clássico)
INSERT INTO public.commissions (marketplace_id, category_id, rate, tenant_id)
SELECT 
  m.id as marketplace_id,
  NULL as category_id,
  0.12 as rate, -- 12% em decimal
  m.tenant_id
FROM public.marketplaces m 
WHERE m.name = 'Mercado Livre Livros'
ON CONFLICT (marketplace_id, category_id) DO UPDATE SET
  rate = EXCLUDED.rate,
  updated_at = now();