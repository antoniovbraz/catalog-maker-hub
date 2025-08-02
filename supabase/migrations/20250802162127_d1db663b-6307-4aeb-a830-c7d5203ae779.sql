-- Limpar dados de todas as tabelas exceto usuários
TRUNCATE TABLE saved_pricing CASCADE;
TRUNCATE TABLE sales CASCADE;
TRUNCATE TABLE shipping_rules CASCADE;
TRUNCATE TABLE marketplace_fixed_fee_rules CASCADE;
TRUNCATE TABLE commissions CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE marketplaces CASCADE;

-- Repopular categorias
INSERT INTO categories (name, description) VALUES
('Eletrônicos', 'Produtos eletrônicos em geral'),
('Casa e Decoração', 'Itens para casa e decoração'),
('Roupas e Acessórios', 'Vestuário e acessórios'),
('Esportes e Fitness', 'Artigos esportivos e fitness'),
('Livros e Mídia', 'Livros, filmes e mídia digital'),
('Beleza e Cuidados', 'Produtos de beleza e cuidados pessoais'),
('Automotivo', 'Peças e acessórios automotivos'),
('Infantil', 'Produtos para bebês e crianças');

-- Repopular marketplaces hierárquicos
INSERT INTO marketplaces (name, description, url, parent_marketplace_id, marketplace_metadata) VALUES
-- Mercado Livre (pai)
('Mercado Livre', 'Maior marketplace da América Latina', 'https://mercadolivre.com.br', NULL, '{"platform": "mercadolivre", "type": "parent"}'),

-- Shopee (pai)  
('Shopee', 'Marketplace asiático em expansão no Brasil', 'https://shopee.com.br', NULL, '{"platform": "shopee", "type": "parent"}'),

-- Marketplaces independentes
('Amazon', 'Marketplace global da Amazon', 'https://amazon.com.br', NULL, '{"platform": "amazon", "type": "independent"}'),
('Magalu', 'Marketplace do Magazine Luiza', 'https://magazineluiza.com.br', NULL, '{"platform": "magalu", "type": "independent"}'),
('Americanas', 'Marketplace das Lojas Americanas', 'https://americanas.com.br', NULL, '{"platform": "americanas", "type": "independent"}'),
('Casas Bahia', 'Marketplace das Casas Bahia', 'https://casasbahia.com.br', NULL, '{"platform": "casasbahia", "type": "independent"}');

-- Inserir subtipos do Mercado Livre
INSERT INTO marketplaces (name, description, parent_marketplace_id, marketplace_metadata)
SELECT 
  'Mercado Livre Clássico',
  'Anúncios clássicos do Mercado Livre',
  ml.id,
  '{"platform": "mercadolivre", "type": "classic", "commission_type": "percentage"}'
FROM marketplaces ml WHERE ml.name = 'Mercado Livre';

INSERT INTO marketplaces (name, description, parent_marketplace_id, marketplace_metadata)
SELECT 
  'Mercado Livre Premium',
  'Anúncios premium do Mercado Livre',
  ml.id,
  '{"platform": "mercadolivre", "type": "premium", "commission_type": "percentage"}'
FROM marketplaces ml WHERE ml.name = 'Mercado Livre';

-- Inserir subtipos do Shopee
INSERT INTO marketplaces (name, description, parent_marketplace_id, marketplace_metadata)
SELECT 
  'Shopee Padrão',
  'Vendas padrão na Shopee',
  s.id,
  '{"platform": "shopee", "type": "standard", "commission_type": "percentage"}'
FROM marketplaces s WHERE s.name = 'Shopee';

INSERT INTO marketplaces (name, description, parent_marketplace_id, marketplace_metadata)
SELECT 
  'Shopee Mall',
  'Shopee Mall para marcas oficiais',
  s.id,
  '{"platform": "shopee", "type": "mall", "commission_type": "percentage"}'
FROM marketplaces s WHERE s.name = 'Shopee';

-- Repopular comissões por marketplace (valores como decimal, não percentual)
-- Mercado Livre Clássico
INSERT INTO commissions (marketplace_id, category_id, rate)
SELECT mlc.id, NULL, 0.16 -- 16% = 0.16
FROM marketplaces mlc WHERE mlc.name = 'Mercado Livre Clássico';

-- Mercado Livre Premium  
INSERT INTO commissions (marketplace_id, category_id, rate)
SELECT mlp.id, NULL, 0.11 -- 11% = 0.11
FROM marketplaces mlp WHERE mlp.name = 'Mercado Livre Premium';

-- Shopee Padrão
INSERT INTO commissions (marketplace_id, category_id, rate)
SELECT sp.id, NULL, 0.10 -- 10% = 0.10
FROM marketplaces sp WHERE sp.name = 'Shopee Padrão';

-- Shopee Mall
INSERT INTO commissions (marketplace_id, category_id, rate)
SELECT sm.id, NULL, 0.08 -- 8% = 0.08
FROM marketplaces sm WHERE sm.name = 'Shopee Mall';

-- Amazon
INSERT INTO commissions (marketplace_id, category_id, rate)
SELECT a.id, NULL, 0.15 -- 15% = 0.15
FROM marketplaces a WHERE a.name = 'Amazon';

-- Magalu
INSERT INTO commissions (marketplace_id, category_id, rate)
SELECT m.id, NULL, 0.12 -- 12% = 0.12
FROM marketplaces m WHERE m.name = 'Magalu';

-- Americanas
INSERT INTO commissions (marketplace_id, category_id, rate)
SELECT a.id, NULL, 0.18 -- 18% = 0.18
FROM marketplaces a WHERE a.name = 'Americanas';

-- Casas Bahia
INSERT INTO commissions (marketplace_id, category_id, rate)
SELECT cb.id, NULL, 0.14 -- 14% = 0.14
FROM marketplaces cb WHERE cb.name = 'Casas Bahia';

-- Repopular taxas fixas
INSERT INTO marketplace_fixed_fee_rules (marketplace_id, rule_type, value, range_min, range_max)
SELECT sp.id, 'faixa', 50.0, 0.01, 7.99 -- 50% = R$ para produtos < R$ 8
FROM marketplaces sp WHERE sp.name = 'Shopee Padrão';

INSERT INTO marketplace_fixed_fee_rules (marketplace_id, rule_type, value)
SELECT sm.id, 'constante', 1.5 -- R$ 1,50 taxa fixa
FROM marketplaces sm WHERE sm.name = 'Shopee Mall';

INSERT INTO marketplace_fixed_fee_rules (marketplace_id, rule_type, value)
SELECT mlc.id, 'constante', 4.99 -- R$ 4,99 taxa fixa
FROM marketplaces mlc WHERE mlc.name = 'Mercado Livre Clássico';

INSERT INTO marketplace_fixed_fee_rules (marketplace_id, rule_type, value)
SELECT mlp.id, 'constante', 6.99 -- R$ 6,99 taxa fixa
FROM marketplaces mlp WHERE mlp.name = 'Mercado Livre Premium';

INSERT INTO marketplace_fixed_fee_rules (marketplace_id, rule_type, value)
SELECT a.id, 'constante', 3.99 -- R$ 3,99 taxa fixa
FROM marketplaces a WHERE a.name = 'Amazon';

-- Repopular regras de frete padrão
INSERT INTO shipping_rules (marketplace_id, product_id, shipping_cost, free_shipping_threshold)
SELECT mlc.id, NULL, 15.99, 99.00 
FROM marketplaces mlc WHERE mlc.name = 'Mercado Livre Clássico';

INSERT INTO shipping_rules (marketplace_id, product_id, shipping_cost, free_shipping_threshold)
SELECT mlp.id, NULL, 0.00, 0.00 
FROM marketplaces mlp WHERE mlp.name = 'Mercado Livre Premium';

INSERT INTO shipping_rules (marketplace_id, product_id, shipping_cost, free_shipping_threshold)
SELECT sp.id, NULL, 12.99, 79.00 
FROM marketplaces sp WHERE sp.name = 'Shopee Padrão';

INSERT INTO shipping_rules (marketplace_id, product_id, shipping_cost, free_shipping_threshold)
SELECT sm.id, NULL, 8.99, 59.00 
FROM marketplaces sm WHERE sm.name = 'Shopee Mall';

INSERT INTO shipping_rules (marketplace_id, product_id, shipping_cost, free_shipping_threshold)
SELECT a.id, NULL, 19.99, 129.00 
FROM marketplaces a WHERE a.name = 'Amazon';

-- Produtos de exemplo (corrigindo tax_rate para formato decimal)
INSERT INTO products (name, sku, description, cost_unit, packaging_cost, tax_rate, category_id)
SELECT 
  'Smartphone Android 128GB',
  'SMART-001',
  'Smartphone Android com 128GB de armazenamento',
  450.00,
  15.00,
  0.27, -- 27% = 0.27
  c.id
FROM categories c WHERE c.name = 'Eletrônicos';

INSERT INTO products (name, sku, description, cost_unit, packaging_cost, tax_rate, category_id)
SELECT 
  'Camiseta Básica Algodão',
  'CAM-001',
  'Camiseta básica 100% algodão',
  25.00,
  3.50,
  0.175, -- 17.5% = 0.175
  c.id
FROM categories c WHERE c.name = 'Roupas e Acessórios';

INSERT INTO products (name, sku, description, cost_unit, packaging_cost, tax_rate, category_id)
SELECT 
  'Luminária LED Mesa',
  'LUM-001',
  'Luminária LED para mesa de trabalho',
  65.00,
  8.00,
  0.20, -- 20% = 0.20
  c.id
FROM categories c WHERE c.name = 'Casa e Decoração';