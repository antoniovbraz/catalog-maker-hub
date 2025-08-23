# Webhooks

Webhooks mantêm a integração atualizada com eventos do Mercado Livre.

## Configuração

- URL: `https://<sua-instancia-api>.catalogmakerhub.com/webhooks/mercadolivre`
- Implementada como Edge Function `handleMLWebhook`.

## Tópicos Suportados

- `orders_v2`: pedidos e status.
- `items`: alterações em anúncios.
- `payments`: atualizações de pagamento.
- `questions`: perguntas de compradores.

## Validação e Processamento

1. Recebimento da notificação com `topic` e `resource`.
2. Confirmação via API do recurso informado.
3. Verificação de propriedade do `tenant_id`.
4. Processamento pelo `WebhookService`, chamando `SalesService` ou `SyncService`.
5. Sistema de retries garante idempotência quando não ocorre resposta `200 OK`.

