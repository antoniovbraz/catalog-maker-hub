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

