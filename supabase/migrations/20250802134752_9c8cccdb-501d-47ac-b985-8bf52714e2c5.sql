-- Migração para popular dados iniciais
-- Primeiro, vamos criar um super admin tenant padrão
DO $$
DECLARE 
    super_admin_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Inserir dados iniciais para o super admin tenant
    -- Categorias padrão
    INSERT INTO public.categories (id, name, description, tenant_id) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Eletrônicos', 'Produtos eletrônicos e tecnologia', super_admin_tenant_id),
    ('10000000-0000-0000-0000-000000000002', 'Casa e Decoração', 'Produtos para casa e decoração', super_admin_tenant_id),
    ('10000000-0000-0000-0000-000000000003', 'Roupas e Acessórios', 'Vestuário e acessórios', super_admin_tenant_id),
    ('10000000-0000-0000-0000-000000000004', 'Esportes e Fitness', 'Artigos esportivos e fitness', super_admin_tenant_id),
    ('10000000-0000-0000-0000-000000000005', 'Livros e Mídia', 'Livros, filmes e mídia', super_admin_tenant_id)
    ON CONFLICT (id) DO NOTHING;

    -- Marketplaces padrão
    INSERT INTO public.marketplaces (id, name, description, url, tenant_id) VALUES
    ('20000000-0000-0000-0000-000000000001', 'Mercado Livre Clássico', 'Mercado Livre modalidade clássica', 'https://mercadolivre.com.br', super_admin_tenant_id),
    ('20000000-0000-0000-0000-000000000002', 'Mercado Livre Premium', 'Mercado Livre modalidade premium', 'https://mercadolivre.com.br', super_admin_tenant_id),
    ('20000000-0000-0000-0000-000000000003', 'Shopee', 'Marketplace Shopee', 'https://shopee.com.br', super_admin_tenant_id),
    ('20000000-0000-0000-0000-000000000004', 'Amazon', 'Amazon Brasil', 'https://amazon.com.br', super_admin_tenant_id),
    ('20000000-0000-0000-0000-000000000005', 'Magazine Luiza', 'Magazine Luiza marketplace', 'https://magazineluiza.com.br', super_admin_tenant_id)
    ON CONFLICT (id) DO NOTHING;

    -- Comissões padrão por marketplace
    INSERT INTO public.commissions (marketplace_id, category_id, rate, tenant_id) VALUES
    -- Mercado Livre Clássico
    ('20000000-0000-0000-0000-000000000001', NULL, 0.12, super_admin_tenant_id), -- 12% geral
    -- Mercado Livre Premium  
    ('20000000-0000-0000-0000-000000000002', NULL, 0.08, super_admin_tenant_id), -- 8% geral
    -- Shopee
    ('20000000-0000-0000-0000-000000000003', NULL, 0.10, super_admin_tenant_id), -- 10% geral
    -- Amazon
    ('20000000-0000-0000-0000-000000000004', NULL, 0.15, super_admin_tenant_id), -- 15% geral
    -- Magazine Luiza
    ('20000000-0000-0000-0000-000000000005', NULL, 0.18, super_admin_tenant_id) -- 18% geral
    ON CONFLICT DO NOTHING;

    -- Taxas fixas padrão
    INSERT INTO public.marketplace_fixed_fee_rules (marketplace_id, rule_type, value, range_min, range_max, tenant_id) VALUES
    -- Mercado Livre - taxa fixa constante
    ('20000000-0000-0000-0000-000000000001', 'constante', 5.00, NULL, NULL, super_admin_tenant_id),
    ('20000000-0000-0000-0000-000000000002', 'constante', 3.00, NULL, NULL, super_admin_tenant_id),
    -- Shopee - taxa por faixa
    ('20000000-0000-0000-0000-000000000003', 'faixa', 2.00, 0, 50, super_admin_tenant_id),
    ('20000000-0000-0000-0000-000000000003', 'faixa', 4.00, 50.01, 200, super_admin_tenant_id),
    ('20000000-0000-0000-0000-000000000003', 'faixa', 6.00, 200.01, 999999, super_admin_tenant_id)
    ON CONFLICT DO NOTHING;

    -- Regras de frete padrão
    INSERT INTO public.shipping_rules (marketplace_id, product_id, shipping_cost, free_shipping_threshold, tenant_id) VALUES
    ('20000000-0000-0000-0000-000000000001', NULL, 15.00, 99.00, super_admin_tenant_id),
    ('20000000-0000-0000-0000-000000000002', NULL, 12.00, 79.00, super_admin_tenant_id),
    ('20000000-0000-0000-0000-000000000003', NULL, 18.00, 149.00, super_admin_tenant_id),
    ('20000000-0000-0000-0000-000000000004', NULL, 20.00, 129.00, super_admin_tenant_id),
    ('20000000-0000-0000-0000-000000000005', NULL, 25.00, 199.00, super_admin_tenant_id)
    ON CONFLICT DO NOTHING;
END $$;