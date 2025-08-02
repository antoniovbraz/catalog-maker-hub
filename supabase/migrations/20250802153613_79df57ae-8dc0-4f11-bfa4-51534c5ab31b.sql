-- Habilitar realtime para as tabelas de regras de precificação
ALTER TABLE public.commissions REPLICA IDENTITY FULL;
ALTER TABLE public.marketplace_fixed_fee_rules REPLICA IDENTITY FULL;
ALTER TABLE public.shipping_rules REPLICA IDENTITY FULL;

-- Adicionar às publicações do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.commissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_fixed_fee_rules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipping_rules;