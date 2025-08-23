# Gestão de Vendas

A sincronização de vendas ocorre do Mercado Livre para o Catalog Maker Hub.

## Notificações em Tempo Real

1. Mercado Livre envia webhook para a URL configurada.
2. O sistema busca detalhes do pedido (`GET /orders/{order_id}`).
3. A venda é registrada localmente e o estoque é atualizado.

## Sincronização Periódica

- A cada 30 minutos, uma rotina busca pedidos recentes para evitar perda de dados.

## Gerenciamento de Estoque

- Vendas em qualquer marketplace, ajustes manuais ou entradas de estoque atualizam o inventário.
- Alterações propagam para o Mercado Livre via `PUT /items/{item_id}`.
- Conflitos são resolvidos com estratégia **Last Write Wins** e registros na tabela `ml_sync_log`.

