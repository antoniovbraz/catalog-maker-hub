-- Criar regras de comissão para Shopee
-- Shopee sem Programa de Frete Grátis: 14% (12,5% + 1,5%)
INSERT INTO public.commissions (marketplace_id, category_id, rate)
VALUES ('2f525fd5-3ec7-4b22-8e3b-8210e2553ac3', NULL, 0.14);

-- Shopee com Programa de Frete Grátis: 20% (12,5% + 1,5% + 6%)
-- Vamos criar uma categoria específica para identificar vendedores com frete grátis
INSERT INTO public.categories (name, description)
VALUES ('Shopee - Programa Frete Grátis', 'Produtos vendidos por vendedores que participam do Programa de Frete Grátis da Shopee');

-- Inserir a comissão para vendedores com frete grátis
INSERT INTO public.commissions (marketplace_id, category_id, rate)
VALUES ('2f525fd5-3ec7-4b22-8e3b-8210e2553ac3', 
        (SELECT id FROM public.categories WHERE name = 'Shopee - Programa Frete Grátis'), 
        0.20);

-- Criar regras de taxa fixa para Shopee
-- Taxa fixa de R$4 para produtos acima de R$8
INSERT INTO public.marketplace_fixed_fee_rules (marketplace_id, rule_type, range_min, range_max, value)
VALUES ('2f525fd5-3ec7-4b22-8e3b-8210e2553ac3', 'faixa', 8.00, 999999.99, 4.00);

-- Taxa fixa especial para produtos abaixo de R$8 (50% do valor do produto)
-- Como não podemos fazer percentual sobre valor do produto diretamente, vamos criar faixas
INSERT INTO public.marketplace_fixed_fee_rules (marketplace_id, rule_type, range_min, range_max, value)
VALUES 
  ('2f525fd5-3ec7-4b22-8e3b-8210e2553ac3', 'faixa', 0.01, 2.00, 1.00),  -- Para produtos até R$2, taxa de R$1
  ('2f525fd5-3ec7-4b22-8e3b-8210e2553ac3', 'faixa', 2.01, 4.00, 2.00),  -- Para produtos R$2-4, taxa de R$2
  ('2f525fd5-3ec7-4b22-8e3b-8210e2553ac3', 'faixa', 4.01, 6.00, 3.00),  -- Para produtos R$4-6, taxa de R$3
  ('2f525fd5-3ec7-4b22-8e3b-8210e2553ac3', 'faixa', 6.01, 7.99, 3.50);  -- Para produtos R$6-8, taxa de R$3.50