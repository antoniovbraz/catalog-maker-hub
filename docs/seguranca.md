# Segurança - Catalog Maker Hub

Baseado em OWASP ASVS 4.0

## Itens Checados
- V1: Arquitetura, Design e Ameaças
- V2: Autenticação
- V3: Gerenciamento de Sessão
- V4: Controle de Acesso
- V5: Validação, Sanitização e Encode
- V6: Armazenamento Criptográfico
- V7: Erros e Logs
- V8: Proteções de Dados
- V10: Comunicação

## Gaps Identificados
- Falta de política RLS para tabelas críticas (`ml_tokens`, `ml_pkce_storage`)
- Ausência de verificação de assinatura em webhooks (V10)
- Tokens de acesso armazenados sem criptografia (V6)
- Inputs de Edge Functions sem validação robusta (V5)
- Logs sem correlação e sem mascaramento de dados sensíveis (V7)

## Recomendações
1. **RLS e Policies de Storage**
   - Implementar isolamento por `tenant_id`
2. **Criptografia de Tokens**
   - Usar `pgcrypto` para armazenar `refresh_token`
3. **Webhooks Seguros**
   - Verificar `X-Hub-Signature` com HMAC SHA256
   - Garantir idempotência por `event_id`
4. **Validação Zod**
   - Schemas para todas as funções `supabase/functions/*`
5. **Logging Estruturado**
   - Usar formato JSON e remover PII

## Exemplo de Policy RLS
```sql
create policy "tenant_read" on ml_tokens
  for select using (auth.uid() = owner_id);
```

## Exemplo de Verificação de Assinatura
```ts
const signature = req.headers.get('x-hub-signature-256')
const body = await req.text()
const expected = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`
if (signature !== expected) return new Response('invalid signature', {status:401})
```
