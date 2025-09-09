# Visão Geral da Integração Mercado Livre

A integração do Catalog Maker Hub com o Mercado Livre centraliza o gerenciamento de catálogo, vendas e estoque.

## Principais Funcionalidades

- Sincronizar produtos bidirecionalmente.
- Receber e gerenciar vendas em tempo real.
- Manter o estoque consistente entre plataformas.
- Aplicar estratégias de precificação dinâmicas.

## Primeiros Passos

1. Possuir contas no Catalog Maker Hub e no Mercado Livre.
2. Criar a aplicação no [DevCenter](https://developers.mercadolivre.com.br/).
3. Definir a URL de redirecionamento: `https://peepers-hub.lovable.app/api/ml/callback`.
4. Selecionar os escopos `read`, `write` e `offline_access`.
5. Registrar a URL de webhooks: `https://peepers-hub.lovable.app/api/webhooks/mercadolivre` com tópicos `items`, `orders_v2`, `payments` e `questions`.

## Variáveis de Ambiente

A integração requer as seguintes variáveis:

- `VITE_ML_CLIENT_ID`: ID da aplicação para uso no frontend.
- `MELI_CLIENT_ID` e `MELI_CLIENT_SECRET`: credenciais da aplicação utilizadas nas Edge Functions.
- `MELI_REDIRECT_URI`: URL de redirecionamento configurada no DevCenter.
- `MELI_WEBHOOK_SECRET`: segredo utilizado para validar webhooks.

As variáveis `MELI_CLIENT_ID`, `MELI_CLIENT_SECRET`, `MELI_REDIRECT_URI` e `MELI_WEBHOOK_SECRET` devem ser definidas em `supabase/.env` e carregadas como secrets com `supabase secrets set --env-file supabase/.env`.

