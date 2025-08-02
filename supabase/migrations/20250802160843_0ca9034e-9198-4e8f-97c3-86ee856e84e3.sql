-- Adicionar campos para estrutura hierárquica e metadados aos marketplaces
ALTER TABLE public.marketplaces 
ADD COLUMN parent_marketplace_id UUID REFERENCES public.marketplaces(id),
ADD COLUMN marketplace_metadata JSONB DEFAULT '{}';

-- Criar índice para melhorar performance das consultas hierárquicas
CREATE INDEX idx_marketplaces_parent_id ON public.marketplaces(parent_marketplace_id);

-- Inserir marketplace "Mercado Livre" como pai
INSERT INTO public.marketplaces (id, name, description, url, marketplace_metadata)
VALUES 
  (gen_random_uuid(), 'Mercado Livre', 'Marketplace principal do Mercado Livre', 'https://mercadolivre.com.br', 
   '{"is_parent": true, "platform_type": "marketplace"}');

-- Capturar o ID do Mercado Livre para usar nas inserções seguintes
DO $$
DECLARE
    ml_parent_id UUID;
    shopee_parent_id UUID;
    ml_classico_id UUID;
    ml_premium_id UUID; 
    ml_livros_id UUID;
    shopee_normal_id UUID;
    shopee_frete_gratis_id UUID;
    amazon_id UUID;
    magalu_id UUID;
BEGIN
    -- Buscar o ID do marketplace Mercado Livre
    SELECT id INTO ml_parent_id FROM public.marketplaces WHERE name = 'Mercado Livre';

    -- Inserir marketplaces filhos do Mercado Livre
    INSERT INTO public.marketplaces (id, name, description, url, parent_marketplace_id, marketplace_metadata)
    VALUES 
      (gen_random_uuid(), 'Mercado Livre Clássico', 'Anúncios tradicionais do Mercado Livre', 'https://mercadolivre.com.br', ml_parent_id,
       '{"announcement_type": "classico", "commission_range": "10-14%", "fixed_fee_rules": "variable"}'),
      (gen_random_uuid(), 'Mercado Livre Premium', 'Anúncios premium com maior visibilidade', 'https://mercadolivre.com.br', ml_parent_id,
       '{"announcement_type": "premium", "commission_range": "15-19%", "fixed_fee_rules": "variable", "installments": "12x"}'),
      (gen_random_uuid(), 'Mercado Livre Livros', 'Categoria específica para livros com regras diferenciadas', 'https://mercadolivre.com.br', ml_parent_id,
       '{"announcement_type": "livros", "category_restriction": "books_only", "special_fixed_fee": true}')
    RETURNING id INTO ml_classico_id, ml_premium_id, ml_livros_id;

    -- Inserir marketplace "Shopee" como pai
    INSERT INTO public.marketplaces (id, name, description, url, marketplace_metadata)
    VALUES 
      (gen_random_uuid(), 'Shopee', 'Marketplace mobile-first', 'https://shopee.com.br',
       '{"is_parent": true, "platform_type": "marketplace"}')
    RETURNING id INTO shopee_parent_id;

    -- Inserir marketplaces filhos do Shopee
    INSERT INTO public.marketplaces (id, name, description, url, parent_marketplace_id, marketplace_metadata)
    VALUES 
      (gen_random_uuid(), 'Shopee Normal', 'Modalidade padrão do Shopee', 'https://shopee.com.br', shopee_parent_id,
       '{"shipping_type": "normal", "commission_cap": 100}'),
      (gen_random_uuid(), 'Shopee Frete Grátis', 'Modalidade com frete grátis', 'https://shopee.com.br', shopee_parent_id,
       '{"shipping_type": "free", "commission_cap": 100, "free_shipping": true}')
    RETURNING id INTO shopee_normal_id, shopee_frete_gratis_id;

    -- Inserir outros marketplaces principais
    INSERT INTO public.marketplaces (id, name, description, url, marketplace_metadata)
    VALUES 
      (gen_random_uuid(), 'Amazon', 'Marketplace global da Amazon', 'https://amazon.com.br',
       '{"is_parent": false, "platform_type": "marketplace", "global": true}'),
      (gen_random_uuid(), 'Magalu', 'Marketplace do Magazine Luiza', 'https://magazineluiza.com.br',
       '{"is_parent": false, "platform_type": "marketplace", "nacional": true}')
    RETURNING id INTO amazon_id, magalu_id;

    -- Buscar IDs dos marketplaces criados
    SELECT id INTO ml_classico_id FROM public.marketplaces WHERE name = 'Mercado Livre Clássico';
    SELECT id INTO ml_premium_id FROM public.marketplaces WHERE name = 'Mercado Livre Premium';
    SELECT id INTO ml_livros_id FROM public.marketplaces WHERE name = 'Mercado Livre Livros';
    SELECT id INTO shopee_normal_id FROM public.marketplaces WHERE name = 'Shopee Normal';
    SELECT id INTO shopee_frete_gratis_id FROM public.marketplaces WHERE name = 'Shopee Frete Grátis';
    SELECT id INTO amazon_id FROM public.marketplaces WHERE name = 'Amazon';
    SELECT id INTO magalu_id FROM public.marketplaces WHERE name = 'Magalu';

    -- Inserir comissões padrão para os novos marketplaces
    INSERT INTO public.commissions (marketplace_id, category_id, rate, tenant_id)
    VALUES 
      (ml_classico_id, NULL, 0.12, NULL), -- 12% padrão
      (ml_premium_id, NULL, 0.16, NULL), -- 16% padrão
      (ml_livros_id, NULL, 0.12, NULL), -- 12% padrão para livros
      (shopee_normal_id, NULL, 0.10, NULL), -- 10% padrão
      (shopee_frete_gratis_id, NULL, 0.10, NULL), -- 10% padrão
      (amazon_id, NULL, 0.15, NULL), -- 15% padrão
      (magalu_id, NULL, 0.14, NULL); -- 14% padrão

    -- Inserir regras de taxa fixa para os marketplaces
    INSERT INTO public.marketplace_fixed_fee_rules (marketplace_id, rule_type, value, range_min, range_max, tenant_id)
    VALUES 
      -- Mercado Livre Clássico - Regras complexas
      (ml_classico_id, 'faixa', 50.0, 0, 12.50, NULL), -- Até R$ 12,50: 50% do preço
      (ml_classico_id, 'constante', 6.25, 12.50, 29.00, NULL), -- R$ 12,50-29: R$ 6,25
      (ml_classico_id, 'constante', 6.50, 29.00, 50.00, NULL), -- R$ 29-50: R$ 6,50
      (ml_classico_id, 'constante', 6.75, 50.00, 79.00, NULL), -- R$ 50-79: R$ 6,75
      (ml_classico_id, 'constante', 7.00, 79.00, 999999.00, NULL), -- Acima R$ 79: R$ 7,00
      
      -- Mercado Livre Premium - Mesmas regras do clássico
      (ml_premium_id, 'faixa', 50.0, 0, 12.50, NULL),
      (ml_premium_id, 'constante', 6.25, 12.50, 29.00, NULL),
      (ml_premium_id, 'constante', 6.50, 29.00, 50.00, NULL),
      (ml_premium_id, 'constante', 6.75, 50.00, 79.00, NULL),
      (ml_premium_id, 'constante', 7.00, 79.00, 999999.00, NULL),
      
      -- Mercado Livre Livros - Regras específicas para livros
      (ml_livros_id, 'faixa', 50.0, 0, 6.00, NULL), -- Até R$ 6: 50% do preço
      (ml_livros_id, 'constante', 3.00, 6.00, 29.00, NULL), -- R$ 6-29: R$ 3,00
      (ml_livros_id, 'constante', 3.50, 29.00, 50.00, NULL), -- R$ 29-50: R$ 3,50
      (ml_livros_id, 'constante', 4.00, 50.00, 79.00, NULL), -- R$ 50-79: R$ 4,00
      (ml_livros_id, 'constante', 4.50, 79.00, 999999.00, NULL), -- Acima R$ 79: R$ 4,50
      
      -- Shopee - Taxa fixa simples
      (shopee_normal_id, 'constante', 2.00, 0, 999999.00, NULL),
      (shopee_frete_gratis_id, 'constante', 2.50, 0, 999999.00, NULL),
      
      -- Amazon
      (amazon_id, 'constante', 4.00, 0, 999999.00, NULL),
      
      -- Magalu
      (magalu_id, 'constante', 3.50, 0, 999999.00, NULL);

END $$;