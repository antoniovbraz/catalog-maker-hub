-- Tabela de marketplaces
CREATE TABLE public.marketplaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de categorias (não vinculada a nenhum marketplace específico)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de produtos
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  cost_unit NUMERIC(10,2) NOT NULL,        -- custo unitário de aquisição
  packaging_cost NUMERIC(10,2) DEFAULT 0,  -- custo da embalagem
  tax_rate NUMERIC(5,4) DEFAULT 0,         -- alíquota de imposto (ex.: 0.04 = 4%)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de comissões por marketplace e categoria
CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id UUID REFERENCES public.marketplaces(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  rate NUMERIC(5,4) NOT NULL,              -- ex.: 0.13 = 13%
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (marketplace_id, category_id)
);

-- Tabela de regras de valor fixo por marketplace
-- Permite armazenar múltiplas faixas ou valores constantes
CREATE TABLE public.marketplace_fixed_fee_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id UUID REFERENCES public.marketplaces(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,                 -- 'constant', 'range' ou 'percentage'
  range_min NUMERIC(10,2),
  range_max NUMERIC(10,2),
  value NUMERIC(10,2) NOT NULL,            -- valor da taxa fixa ou percentual
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de regras de frete por produto e marketplace
CREATE TABLE public.shipping_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  marketplace_id UUID REFERENCES public.marketplaces(id) ON DELETE CASCADE,
  shipping_cost NUMERIC(10,2) NOT NULL,    -- custo do frete quando cobrado
  free_shipping_threshold NUMERIC(10,2) DEFAULT 0, -- valor a partir do qual o frete é grátis
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (product_id, marketplace_id)
);

-- (Opcional) Tabela de vendas para cálculo de giro/margem real
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id),
  marketplace_id UUID REFERENCES public.marketplaces(id),
  price_charged NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  sold_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.marketplaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_fixed_fee_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_marketplaces_updated_at
    BEFORE UPDATE ON public.marketplaces
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at
    BEFORE UPDATE ON public.commissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_fixed_fee_rules_updated_at
    BEFORE UPDATE ON public.marketplace_fixed_fee_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shipping_rules_updated_at
    BEFORE UPDATE ON public.shipping_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();