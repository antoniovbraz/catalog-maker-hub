-- Criar tabela de assistentes IA
CREATE TABLE public.assistants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  marketplace TEXT NOT NULL CHECK (marketplace IN ('mercado_livre', 'shopee', 'instagram')),
  model TEXT NOT NULL DEFAULT 'gpt-4o',
  instructions TEXT NOT NULL,
  assistant_id TEXT NOT NULL, -- ID retornado pela OpenAI
  tenant_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_marketplace_per_tenant UNIQUE (marketplace, tenant_id)
);

-- Habilitar RLS
ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;

-- Política para permitir que super admins gerenciem assistentes
CREATE POLICY "Super admins can manage assistants" 
ON public.assistants 
FOR ALL 
USING (get_current_user_role() = 'super_admin'::user_role);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_assistants_updated_at
BEFORE UPDATE ON public.assistants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();