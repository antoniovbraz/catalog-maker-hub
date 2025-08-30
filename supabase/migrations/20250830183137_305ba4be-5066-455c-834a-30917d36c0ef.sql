-- Atualizar tabela ml_category_mapping para incluir descrição
ALTER TABLE public.ml_category_mapping 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_ml_category_mapping_tenant_category 
ON public.ml_category_mapping(tenant_id, category_id);

CREATE INDEX IF NOT EXISTS idx_ml_category_mapping_ml_category 
ON public.ml_category_mapping(tenant_id, ml_category_id);

-- Criar função para buscar categorias ML populares
CREATE OR REPLACE FUNCTION public.get_popular_ml_categories()
RETURNS TABLE(
  ml_category_id text,
  ml_category_name text,
  usage_count bigint
) LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mpm.ml_category_id,
    mcm.ml_category_name,
    COUNT(*)::bigint as usage_count
  FROM public.ml_product_mapping mpm
  LEFT JOIN public.ml_category_mapping mcm ON mcm.ml_category_id = mpm.ml_category_id
  WHERE mpm.ml_category_id IS NOT NULL
  GROUP BY mpm.ml_category_id, mcm.ml_category_name
  ORDER BY usage_count DESC
  LIMIT 20;
END;
$$;

-- Criar função para sincronização automática de categorias ML
CREATE OR REPLACE FUNCTION public.sync_ml_category_mapping(
  p_tenant_id uuid,
  p_ml_category_id text,
  p_ml_category_name text,
  p_category_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mapping_id uuid;
BEGIN
  INSERT INTO public.ml_category_mapping (
    tenant_id,
    ml_category_id,
    ml_category_name,
    category_id,
    is_default
  ) VALUES (
    p_tenant_id,
    p_ml_category_id,
    p_ml_category_name,
    p_category_id,
    p_category_id IS NULL
  )
  ON CONFLICT (tenant_id, ml_category_id)
  DO UPDATE SET
    ml_category_name = EXCLUDED.ml_category_name,
    updated_at = now()
  RETURNING id INTO v_mapping_id;
  
  RETURN v_mapping_id;
END;
$$;