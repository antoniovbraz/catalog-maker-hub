-- Configurar taxas fixas do Mercado Livre
-- Limpar regras existentes do Mercado Livre
DELETE FROM public.marketplace_fixed_fee_rules WHERE marketplace_id IN (
  SELECT id FROM public.marketplaces WHERE name ILIKE '%mercado%livre%'
);

-- Mercado Livre Clássico e Premium - Regras por faixa
-- Faixa 1: < R$ 12,50 - 50% do valor do produto
INSERT INTO public.marketplace_fixed_fee_rules (marketplace_id, rule_type, range_min, range_max, value, tenant_id)
SELECT 
  m.id as marketplace_id,
  'faixa' as rule_type,
  0 as range_min,
  12.49 as range_max,
  50 as value, -- 50% do valor do produto
  m.tenant_id
FROM public.marketplaces m 
WHERE m.name IN ('Mercado Livre Clássico', 'Mercado Livre Premium');

-- Faixa 2: R$ 12,50 - R$ 29 - R$ 6,25
INSERT INTO public.marketplace_fixed_fee_rules (marketplace_id, rule_type, range_min, range_max, value, tenant_id)
SELECT 
  m.id as marketplace_id,
  'faixa' as rule_type,
  12.50 as range_min,
  29.00 as range_max,
  6.25 as value,
  m.tenant_id
FROM public.marketplaces m 
WHERE m.name IN ('Mercado Livre Clássico', 'Mercado Livre Premium');

-- Faixa 3: R$ 29 - R$ 50 - R$ 6,50
INSERT INTO public.marketplace_fixed_fee_rules (marketplace_id, rule_type, range_min, range_max, value, tenant_id)
SELECT 
  m.id as marketplace_id,
  'faixa' as rule_type,
  29.01 as range_min,
  50.00 as range_max,
  6.50 as value,
  m.tenant_id
FROM public.marketplaces m 
WHERE m.name IN ('Mercado Livre Clássico', 'Mercado Livre Premium');

-- Faixa 4: R$ 50 - R$ 79 - R$ 6,75
INSERT INTO public.marketplace_fixed_fee_rules (marketplace_id, rule_type, range_min, range_max, value, tenant_id)
SELECT 
  m.id as marketplace_id,
  'faixa' as rule_type,
  50.01 as range_min,
  79.00 as range_max,
  6.75 as value,
  m.tenant_id
FROM public.marketplaces m 
WHERE m.name IN ('Mercado Livre Clássico', 'Mercado Livre Premium');

-- Mercado Livre Livros - Regras específicas para livros
-- Faixa 1: Até R$ 6 - 50% do valor do produto
INSERT INTO public.marketplace_fixed_fee_rules (marketplace_id, rule_type, range_min, range_max, value, tenant_id)
SELECT 
  m.id as marketplace_id,
  'faixa' as rule_type,
  0 as range_min,
  6.00 as range_max,
  50 as value, -- 50% do valor do produto
  m.tenant_id
FROM public.marketplaces m 
WHERE m.name = 'Mercado Livre Livros';

-- Faixa 2: R$ 6 - R$ 29 - R$ 3,00
INSERT INTO public.marketplace_fixed_fee_rules (marketplace_id, rule_type, range_min, range_max, value, tenant_id)
SELECT 
  m.id as marketplace_id,
  'faixa' as rule_type,
  6.01 as range_min,
  29.00 as range_max,
  3.00 as value,
  m.tenant_id
FROM public.marketplaces m 
WHERE m.name = 'Mercado Livre Livros';

-- Faixa 3: R$ 29 - R$ 50 - R$ 3,50
INSERT INTO public.marketplace_fixed_fee_rules (marketplace_id, rule_type, range_min, range_max, value, tenant_id)
SELECT 
  m.id as marketplace_id,
  'faixa' as rule_type,
  29.01 as range_min,
  50.00 as range_max,
  3.50 as value,
  m.tenant_id
FROM public.marketplaces m 
WHERE m.name = 'Mercado Livre Livros';

-- Faixa 4: R$ 50 - R$ 79 - R$ 4,00
INSERT INTO public.marketplace_fixed_fee_rules (marketplace_id, rule_type, range_min, range_max, value, tenant_id)
SELECT 
  m.id as marketplace_id,
  'faixa' as rule_type,
  50.01 as range_min,
  79.00 as range_max,
  4.00 as value,
  m.tenant_id
FROM public.marketplaces m 
WHERE m.name = 'Mercado Livre Livros';