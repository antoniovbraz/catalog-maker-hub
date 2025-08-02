-- Inserir/atualizar as comissões da Shopee conforme as novas regras
-- Primeiro, vamos limpar as comissões existentes da Shopee
DELETE FROM public.commissions WHERE marketplace_id IN (
  SELECT id FROM public.marketplaces WHERE name ILIKE '%shopee%'
);

-- Inserir as comissões da Shopee
-- Shopee Padrão (Sem Programa de Frete Grátis): 14%
INSERT INTO public.commissions (marketplace_id, category_id, rate, tenant_id)
SELECT 
  m.id as marketplace_id,
  NULL as category_id, -- Regra padrão para todas as categorias
  0.14 as rate, -- 14% em decimal
  m.tenant_id
FROM public.marketplaces m 
WHERE m.name = 'Shopee' OR m.name = 'Shopee Padrão'
ON CONFLICT (marketplace_id, category_id) DO UPDATE SET
  rate = EXCLUDED.rate,
  updated_at = now();

-- Shopee com Programa de Frete Grátis: 14% + 6% = 20%
INSERT INTO public.commissions (marketplace_id, category_id, rate, tenant_id)
SELECT 
  m.id as marketplace_id,
  NULL as category_id, -- Regra padrão para todas as categorias
  0.20 as rate, -- 20% em decimal (14% + 6%)
  m.tenant_id
FROM public.marketplaces m 
WHERE m.name = 'Shopee PFG' OR m.name = 'Shopee Programa de Frete Grátis'
ON CONFLICT (marketplace_id, category_id) DO UPDATE SET
  rate = EXCLUDED.rate,
  updated_at = now();

-- Atualizar/inserir as taxas fixas da Shopee: R$ 4 por item vendido
-- Primeiro limpar as regras existentes da Shopee
DELETE FROM public.marketplace_fixed_fee_rules WHERE marketplace_id IN (
  SELECT id FROM public.marketplaces WHERE name ILIKE '%shopee%'
);

-- Inserir taxa fixa constante de R$ 4 para ambas as modalidades da Shopee
INSERT INTO public.marketplace_fixed_fee_rules (marketplace_id, rule_type, value, tenant_id)
SELECT 
  m.id as marketplace_id,
  'constante' as rule_type,
  4.00 as value, -- R$ 4,00 por item
  m.tenant_id
FROM public.marketplaces m 
WHERE m.name ILIKE '%shopee%';