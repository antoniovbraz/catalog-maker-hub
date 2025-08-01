-- Função para calcular preço sugerido
CREATE OR REPLACE FUNCTION public.calcular_preco(
  p_product_id UUID,
  p_marketplace_id UUID,
  p_taxa_cartao NUMERIC,       -- Ex.: 2 para 2%
  p_provisao_desconto NUMERIC, -- Ex.: 10 para 10%
  p_margem_desejada NUMERIC    -- Ex.: 25 para 25%
)
RETURNS JSON AS $$
DECLARE
  v_product RECORD;
  v_comissao NUMERIC := 0;
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

  -- Buscar comissão (categoria específica ou default)
  SELECT COALESCE(
    (SELECT rate FROM public.commissions 
     WHERE marketplace_id = p_marketplace_id AND category_id = v_product.category_id),
    (SELECT rate FROM public.commissions 
     WHERE marketplace_id = p_marketplace_id AND category_id IS NULL),
    0
  ) INTO v_comissao;

  -- Buscar taxa fixa (somente tipo 'constante')
  SELECT COALESCE(
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

  -- Calcular custo total (produto + embalagem)
  v_custo_total := v_product.cost_unit + COALESCE(v_product.packaging_cost, 0);

  -- Aplicar imposto (assumindo que tax_rate é percentual: 4 = 4%)
  IF v_product.tax_rate > 0 THEN
    v_custo_total := v_custo_total * (1 + v_product.tax_rate / 100);
  END IF;

  -- Calcular preço sugerido:
  -- Fórmula: (custo_total + fixo + frete) / (1 - (comissão + cartão + desconto + margem)/100)
  v_preco_base := (v_custo_total + v_taxa_fixa + v_frete) / 
                  (1 - (v_comissao + p_taxa_cartao + p_provisao_desconto + p_margem_desejada) / 100);

  v_preco_sugerido := v_preco_base;

  -- Calcular margem unitária e percentual
  v_margem_unitaria := v_preco_sugerido - v_custo_total - v_taxa_fixa - v_frete -
                       (v_preco_sugerido * (v_comissao + p_taxa_cartao + p_provisao_desconto) / 100);

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
    'preco_sugerido', ROUND(v_preco_sugerido, 2),
    'margem_unitaria', ROUND(v_margem_unitaria, 2),
    'margem_percentual', ROUND(v_margem_percentual, 2),
    'product_name', v_product.name,
    'product_sku', v_product.sku
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular margem real com preço praticado
CREATE OR REPLACE FUNCTION public.calcular_margem_real(
  p_product_id UUID,
  p_marketplace_id UUID,
  p_taxa_cartao NUMERIC,       -- Ex.: 2 para 2%
  p_provisao_desconto NUMERIC, -- Ex.: 10 para 10%
  p_preco_praticado NUMERIC    -- Preço que o vendedor está praticando
)
RETURNS JSON AS $$
DECLARE
  v_product RECORD;
  v_comissao NUMERIC := 0;
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

  -- Buscar comissão (categoria específica ou default)
  SELECT COALESCE(
    (SELECT rate FROM public.commissions 
     WHERE marketplace_id = p_marketplace_id AND category_id = v_product.category_id),
    (SELECT rate FROM public.commissions 
     WHERE marketplace_id = p_marketplace_id AND category_id IS NULL),
    0
  ) INTO v_comissao;

  -- Buscar taxa fixa
  SELECT COALESCE(
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

  -- Calcular custo total
  v_custo_total := v_product.cost_unit + COALESCE(v_product.packaging_cost, 0);

  -- Aplicar imposto
  IF v_product.tax_rate > 0 THEN
    v_custo_total := v_custo_total * (1 + v_product.tax_rate / 100);
  END IF;

  -- Calcular margem real
  v_margem_unitaria := p_preco_praticado - v_custo_total - v_taxa_fixa - v_frete -
                       (p_preco_praticado * (v_comissao + p_taxa_cartao + p_provisao_desconto) / 100);

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
    'preco_praticado', ROUND(p_preco_praticado, 2),
    'margem_unitaria_real', ROUND(v_margem_unitaria, 2),
    'margem_percentual_real', ROUND(v_margem_percentual, 2)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;