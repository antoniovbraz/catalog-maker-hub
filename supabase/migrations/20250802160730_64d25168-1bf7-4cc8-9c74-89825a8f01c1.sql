-- Adicionar campos para estrutura hierárquica e metadados aos marketplaces
ALTER TABLE public.marketplaces 
ADD COLUMN parent_marketplace_id UUID REFERENCES public.marketplaces(id),
ADD COLUMN marketplace_metadata JSONB DEFAULT '{}';

-- Criar índice para melhorar performance das consultas hierárquicas
CREATE INDEX idx_marketplaces_parent_id ON public.marketplaces(parent_marketplace_id);

-- Inserir marketplace "Mercado Livre" como pai
INSERT INTO public.marketplaces (id, name, description, url, marketplace_metadata)
VALUES 
  ('ml-parent', 'Mercado Livre', 'Marketplace principal do Mercado Livre', 'https://mercadolivre.com.br', 
   '{"is_parent": true, "platform_type": "marketplace"}');

-- Inserir marketplaces filhos do Mercado Livre
INSERT INTO public.marketplaces (id, name, description, url, parent_marketplace_id, marketplace_metadata)
VALUES 
  ('ml-classico', 'Mercado Livre Clássico', 'Anúncios tradicionais do Mercado Livre', 'https://mercadolivre.com.br', 'ml-parent',
   '{"announcement_type": "classico", "commission_range": "10-14%", "fixed_fee_rules": "variable"}'),
  ('ml-premium', 'Mercado Livre Premium', 'Anúncios premium com maior visibilidade', 'https://mercadolivre.com.br', 'ml-parent',
   '{"announcement_type": "premium", "commission_range": "15-19%", "fixed_fee_rules": "variable", "installments": "12x"}'),
  ('ml-livros', 'Mercado Livre Livros', 'Categoria específica para livros com regras diferenciadas', 'https://mercadolivre.com.br', 'ml-parent',
   '{"announcement_type": "livros", "category_restriction": "books_only", "special_fixed_fee": true}');

-- Inserir marketplace "Shopee" como pai
INSERT INTO public.marketplaces (id, name, description, url, marketplace_metadata)
VALUES 
  ('shopee-parent', 'Shopee', 'Marketplace mobile-first', 'https://shopee.com.br',
   '{"is_parent": true, "platform_type": "marketplace"}');

-- Inserir marketplaces filhos do Shopee
INSERT INTO public.marketplaces (id, name, description, url, parent_marketplace_id, marketplace_metadata)
VALUES 
  ('shopee-normal', 'Shopee Normal', 'Modalidade padrão do Shopee', 'https://shopee.com.br', 'shopee-parent',
   '{"shipping_type": "normal", "commission_cap": 100}'),
  ('shopee-frete-gratis', 'Shopee Frete Grátis', 'Modalidade com frete grátis', 'https://shopee.com.br', 'shopee-parent',
   '{"shipping_type": "free", "commission_cap": 100, "free_shipping": true}');

-- Inserir outros marketplaces principais
INSERT INTO public.marketplaces (id, name, description, url, marketplace_metadata)
VALUES 
  ('amazon', 'Amazon', 'Marketplace global da Amazon', 'https://amazon.com.br',
   '{"is_parent": false, "platform_type": "marketplace", "global": true}'),
  ('magalu', 'Magalu', 'Marketplace do Magazine Luiza', 'https://magazineluiza.com.br',
   '{"is_parent": false, "platform_type": "marketplace", "nacional": true}');

-- Inserir comissões padrão para os novos marketplaces
INSERT INTO public.commissions (marketplace_id, category_id, rate, tenant_id)
VALUES 
  -- Mercado Livre Clássico (10-14%)
  ('ml-classico', NULL, 0.12, NULL), -- 12% padrão
  -- Mercado Livre Premium (15-19%)  
  ('ml-premium', NULL, 0.16, NULL), -- 16% padrão
  -- Mercado Livre Livros (10-14% como clássico)
  ('ml-livros', NULL, 0.12, NULL), -- 12% padrão para livros
  -- Shopee Normal
  ('shopee-normal', NULL, 0.10, NULL), -- 10% padrão
  -- Shopee Frete Grátis
  ('shopee-frete-gratis', NULL, 0.10, NULL), -- 10% padrão
  -- Amazon
  ('amazon', NULL, 0.15, NULL), -- 15% padrão
  -- Magalu
  ('magalu', NULL, 0.14, NULL); -- 14% padrão

-- Inserir regras de taxa fixa para os marketplaces
INSERT INTO public.marketplace_fixed_fee_rules (marketplace_id, rule_type, value, range_min, range_max, tenant_id)
VALUES 
  -- Mercado Livre Clássico - Regras complexas
  ('ml-classico', 'faixa', 50.0, 0, 12.50, NULL), -- Até R$ 12,50: 50% do preço
  ('ml-classico', 'constante', 6.25, 12.50, 29.00, NULL), -- R$ 12,50-29: R$ 6,25
  ('ml-classico', 'constante', 6.50, 29.00, 50.00, NULL), -- R$ 29-50: R$ 6,50
  ('ml-classico', 'constante', 6.75, 50.00, 79.00, NULL), -- R$ 50-79: R$ 6,75
  ('ml-classico', 'constante', 7.00, 79.00, 999999.00, NULL), -- Acima R$ 79: R$ 7,00
  
  -- Mercado Livre Premium - Mesmas regras do clássico
  ('ml-premium', 'faixa', 50.0, 0, 12.50, NULL),
  ('ml-premium', 'constante', 6.25, 12.50, 29.00, NULL),
  ('ml-premium', 'constante', 6.50, 29.00, 50.00, NULL),
  ('ml-premium', 'constante', 6.75, 50.00, 79.00, NULL),
  ('ml-premium', 'constante', 7.00, 79.00, 999999.00, NULL),
  
  -- Mercado Livre Livros - Regras específicas para livros
  ('ml-livros', 'faixa', 50.0, 0, 6.00, NULL), -- Até R$ 6: 50% do preço
  ('ml-livros', 'constante', 3.00, 6.00, 29.00, NULL), -- R$ 6-29: R$ 3,00
  ('ml-livros', 'constante', 3.50, 29.00, 50.00, NULL), -- R$ 29-50: R$ 3,50
  ('ml-livros', 'constante', 4.00, 50.00, 79.00, NULL), -- R$ 50-79: R$ 4,00
  ('ml-livros', 'constante', 4.50, 79.00, 999999.00, NULL), -- Acima R$ 79: R$ 4,50
  
  -- Shopee - Taxa fixa simples
  ('shopee-normal', 'constante', 2.00, 0, 999999.00, NULL),
  ('shopee-frete-gratis', 'constante', 2.50, 0, 999999.00, NULL),
  
  -- Amazon
  ('amazon', 'constante', 4.00, 0, 999999.00, NULL),
  
  -- Magalu
  ('magalu', 'constante', 3.50, 0, 999999.00, NULL);