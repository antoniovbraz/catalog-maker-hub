-- Limpar regras existentes do Mercado Livre Clássico para evitar conflitos
DELETE FROM public.marketplace_fixed_fee_rules 
WHERE marketplace_id = 'e1ec1e20-0fa3-4f85-adf8-5d923bf3ec94';

-- Criar as novas regras de taxa fixa para Mercado Livre Clássico
INSERT INTO public.marketplace_fixed_fee_rules (marketplace_id, rule_type, range_min, range_max, value)
VALUES 
  ('e1ec1e20-0fa3-4f85-adf8-5d923bf3ec94', 'faixa', 12.50, 29.00, 6.25),
  ('e1ec1e20-0fa3-4f85-adf8-5d923bf3ec94', 'faixa', 29.00, 50.00, 6.50),
  ('e1ec1e20-0fa3-4f85-adf8-5d923bf3ec94', 'faixa', 50.00, 79.00, 6.75);