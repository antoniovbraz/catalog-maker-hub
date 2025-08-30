-- Adicionar coluna ml_nickname na tabela ml_auth_tokens para armazenar o nome da loja
ALTER TABLE public.ml_auth_tokens 
ADD COLUMN ml_nickname text;