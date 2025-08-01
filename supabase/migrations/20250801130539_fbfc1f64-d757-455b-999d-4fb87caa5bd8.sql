-- Adicionar regras de taxa fixa faltantes para Mercado Livre Premium
INSERT INTO public.marketplace_fixed_fee_rules (marketplace_id, rule_type, range_min, range_max, value) VALUES
('18194ed9-d637-4dc6-8544-2a8566cd0457', 'faixa', 29.00, 50.00, 6.50),
('18194ed9-d637-4dc6-8544-2a8566cd0457', 'faixa', 50.00, 79.00, 6.75);