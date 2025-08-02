-- Atualizar taxas Shopee conforme política atual

-- 1. Adicionar taxa fixa para Shopee - Programa Frete Grátis
INSERT INTO public.marketplace_fixed_fee_rules (marketplace_id, rule_type, value)
SELECT m.id, 'constante', 4.00
FROM public.marketplaces m
WHERE m.name = 'Shopee - Programa Frete Grátis'
AND NOT EXISTS (
  SELECT 1 FROM public.marketplace_fixed_fee_rules mffr 
  WHERE mffr.marketplace_id = m.id AND mffr.rule_type = 'constante'
);

-- 2. Adicionar regra especial para produtos < R$ 8,00 (ambos Shopee)
INSERT INTO public.marketplace_fixed_fee_rules (marketplace_id, rule_type, value, range_min, range_max)
SELECT m.id, 'faixa', 0.50, 0.01, 7.99
FROM public.marketplaces m
WHERE m.name IN ('Shopee', 'Shopee - Programa Frete Grátis')
AND NOT EXISTS (
  SELECT 1 FROM public.marketplace_fixed_fee_rules mffr 
  WHERE mffr.marketplace_id = m.id AND mffr.rule_type = 'faixa' AND mffr.range_max = 7.99
);

-- 3. Atualizar função calcular_preco com limite de comissão e regra especial < R$ 8
CREATE OR REPLACE FUNCTION public.calcular_preco(p_product_id uuid, p_marketplace_id uuid, p_taxa_cartao numeric, p_provisao_desconto numeric, p_margem_desejada numeric)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_product RECORD;
  v_comissao NUMERIC := 0;
  v_comissao_limitada NUMERIC := 0;
  v_taxa_fixa NUMERIC := 0;
  v_frete NUMERIC := 0;
  v_custo_total NUMERIC;
  v_preco_base NUMERIC;
  v_preco_sugerido NUMERIC;
  v_margem_unitaria NUMERIC;
  v_margem_percentual NUMERIC;
  v_result JSON;
BEGIN
  -- Buscar dados do produto e categoria
  SELECT p.*, c.name AS category_name
  INTO v_product
  FROM public.products p
  LEFT JOIN public.categories c ON p.category_id = c.id
  WHERE p.id = p_product_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Produto não encontrado');
  END IF;

  -- Buscar comissão (categoria específica ou default) - já em formato percentual no banco
  SELECT COALESCE(
    (SELECT rate FROM public.commissions 
     WHERE marketplace_id = p_marketplace_id AND category_id = v_product.category_id),
    (SELECT rate FROM public.commissions 
     WHERE marketplace_id = p_marketplace_id AND category_id IS NULL),
    0
  ) * 100 INTO v_comissao; -- Multiplicar por 100 para converter decimal para percentual

  -- Calcular custo total (produto + embalagem) SEM imposto
  v_custo_total := v_product.cost_unit + COALESCE(v_product.packaging_cost, 0);

  -- Calcular preço base temporário para determinar qual regra de taxa fixa aplicar
  v_preco_base := (v_custo_total) / 
                  (1 - (v_comissao + p_taxa_cartao + p_provisao_desconto + p_margem_desejada + COALESCE(v_product.tax_rate, 0)) / 100);

  -- Buscar taxa fixa com regra especial para produtos < R$ 8,00
  SELECT COALESCE(
    -- Primeiro tenta regra por faixa para produtos < R$ 8,00 (50% do valor do produto)
    (SELECT 
       CASE 
         WHEN v_preco_base < 8.00 THEN v_preco_base * (value / 100)  -- value = 50, então 50% do preço
         ELSE NULL
       END
     FROM public.marketplace_fixed_fee_rules 
     WHERE marketplace_id = p_marketplace_id 
     AND rule_type = 'faixa'
     AND v_preco_base >= range_min 
     AND v_preco_base <= range_max
     LIMIT 1),
    -- Se não se aplica a regra especial, usa a taxa constante
    (SELECT value FROM public.marketplace_fixed_fee_rules 
     WHERE marketplace_id = p_marketplace_id 
     AND rule_type = 'constante'),
    0
  ) INTO v_taxa_fixa;

  -- Buscar frete (específico do produto ou padrão do marketplace)
  SELECT COALESCE(
    (SELECT shipping_cost FROM public.shipping_rules 
     WHERE marketplace_id = p_marketplace_id 
     AND (product_id = p_product_id OR product_id IS NULL)
     ORDER BY product_id DESC NULLS LAST
     LIMIT 1),
    0
  ) INTO v_frete;

  -- Recalcular preço sugerido considerando a taxa fixa encontrada
  v_preco_base := (v_custo_total + v_taxa_fixa + v_frete) / 
                  (1 - (v_comissao + p_taxa_cartao + p_provisao_desconto + p_margem_desejada + COALESCE(v_product.tax_rate, 0)) / 100);

  v_preco_sugerido := v_preco_base;

  -- Aplicar limite máximo de comissão de R$ 100 (somente para Shopee)
  v_comissao_limitada := LEAST(v_preco_sugerido * v_comissao / 100, 100.00);

  -- Calcular margem unitária considerando TODOS os custos sobre o preço de venda (incluindo imposto)
  -- Usar comissão limitada ao invés da comissão percentual total
  v_margem_unitaria := v_preco_sugerido - v_custo_total - v_taxa_fixa - v_frete -
                       v_comissao_limitada -
                       (v_preco_sugerido * (p_taxa_cartao + p_provisao_desconto + COALESCE(v_product.tax_rate, 0)) / 100);

  v_margem_percentual := CASE 
    WHEN v_preco_sugerido > 0 THEN (v_margem_unitaria / v_preco_sugerido) * 100 
    ELSE 0 
  END;

  -- Retornar resultado arredondado
  v_result := json_build_object(
    'custo_total', ROUND(v_custo_total, 2),
    'valor_fixo', ROUND(v_taxa_fixa, 2),
    'frete', ROUND(v_frete, 2),
    'comissao', ROUND(v_comissao, 2),
    'comissao_limitada', ROUND(v_comissao_limitada, 2),
    'preco_sugerido', ROUND(v_preco_sugerido, 2),
    'margem_unitaria', ROUND(v_margem_unitaria, 2),
    'margem_percentual', ROUND(v_margem_percentual, 2),
    'product_name', v_product.name,
    'product_sku', v_product.sku
  );

  RETURN v_result;
END;
$function$;

-- 4. Atualizar função calcular_margem_real com limite de comissão e regra especial < R$ 8
CREATE OR REPLACE FUNCTION public.calcular_margem_real(p_product_id uuid, p_marketplace_id uuid, p_taxa_cartao numeric, p_provisao_desconto numeric, p_preco_praticado numeric)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_product RECORD;
  v_comissao NUMERIC := 0;
  v_comissao_limitada NUMERIC := 0;
  v_taxa_fixa NUMERIC := 0;
  v_frete NUMERIC := 0;
  v_custo_total NUMERIC;
  v_margem_unitaria NUMERIC;
  v_margem_percentual NUMERIC;
  v_result JSON;
BEGIN
  -- Buscar dados do produto
  SELECT * INTO v_product FROM public.products WHERE id = p_product_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Produto não encontrado');
  END IF;

  -- Buscar comissão (categoria específica ou default) - converter para percentual
  SELECT COALESCE(
    (SELECT rate FROM public.commissions 
     WHERE marketplace_id = p_marketplace_id AND category_id = v_product.category_id),
    (SELECT rate FROM public.commissions 
     WHERE marketplace_id = p_marketplace_id AND category_id IS NULL),
    0
  ) * 100 INTO v_comissao; -- Multiplicar por 100 para converter decimal para percentual

  -- Buscar taxa fixa com regra especial para produtos < R$ 8,00
  SELECT COALESCE(
    -- Primeiro tenta regra por faixa para produtos < R$ 8,00 (50% do valor do produto)
    (SELECT 
       CASE 
         WHEN p_preco_praticado < 8.00 THEN p_preco_praticado * (value / 100)  -- value = 50, então 50% do preço
         ELSE NULL
       END
     FROM public.marketplace_fixed_fee_rules 
     WHERE marketplace_id = p_marketplace_id 
     AND rule_type = 'faixa'
     AND p_preco_praticado >= range_min 
     AND p_preco_praticado <= range_max
     LIMIT 1),
    -- Se não se aplica a regra especial, usa a taxa constante
    (SELECT value FROM public.marketplace_fixed_fee_rules 
     WHERE marketplace_id = p_marketplace_id 
     AND rule_type = 'constante'),
    0
  ) INTO v_taxa_fixa;

  -- Buscar frete
  SELECT COALESCE(
    (SELECT shipping_cost FROM public.shipping_rules 
     WHERE marketplace_id = p_marketplace_id 
     AND (product_id = p_product_id OR product_id IS NULL)
     ORDER BY product_id DESC NULLS LAST
     LIMIT 1),
    0
  ) INTO v_frete;

  -- Calcular custo total SEM imposto
  v_custo_total := v_product.cost_unit + COALESCE(v_product.packaging_cost, 0);

  -- Aplicar limite máximo de comissão de R$ 100 (somente para Shopee)
  v_comissao_limitada := LEAST(p_preco_praticado * v_comissao / 100, 100.00);

  -- Calcular margem real considerando imposto sobre o preço praticado
  -- Usar comissão limitada ao invés da comissão percentual total
  v_margem_unitaria := p_preco_praticado - v_custo_total - v_taxa_fixa - v_frete -
                       v_comissao_limitada -
                       (p_preco_praticado * (p_taxa_cartao + p_provisao_desconto + COALESCE(v_product.tax_rate, 0)) / 100);

  v_margem_percentual := CASE 
    WHEN p_preco_praticado > 0 THEN (v_margem_unitaria / p_preco_praticado) * 100 
    ELSE 0 
  END;

  -- Retornar resultado arredondado
  v_result := json_build_object(
    'custo_total', ROUND(v_custo_total, 2),
    'valor_fixo', ROUND(v_taxa_fixa, 2),
    'frete', ROUND(v_frete, 2),
    'comissao', ROUND(v_comissao, 2),
    'comissao_limitada', ROUND(v_comissao_limitada, 2),
    'preco_praticado', ROUND(p_preco_praticado, 2),
    'margem_unitaria_real', ROUND(v_margem_unitaria, 2),
    'margem_percentual_real', ROUND(v_margem_percentual, 2)
  );

  RETURN v_result;
END;
$function$;