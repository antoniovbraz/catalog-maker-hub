# Auditoria Técnica - Catalog Maker Hub

## Sumário Executivo
- Lacunas de validação e tipagem nas Edge Functions do Mercado Livre
- Ausência de policies RLS abrangentes e de controle de Storage
- Componentes React e hooks com responsabilidades múltiplas e queries sem caching
- Falta de observabilidade estruturada e pipeline de CI incompleto
- Cobertura de testes insuficiente (<90%)

## Mapa do Sistema
```ascii
+-------------+        +-----------------+        +---------------------+
| React/Vite  | <----> |  Edge Functions | <----> |  Mercado Livre API  |
| (Frontend)  |        |  (Supabase)     |        |  OAuth/Webhooks     |
+-------------+        +-----------------+        +---------------------+
       |                        |
       v                        v
+-------------+        +-----------------+
| React Query |        |  Supabase DB    |
| Cache/State |        |  RLS/Storage    |
+-------------+        +-----------------+
```

## Auditoria de Código
### Achados
- Violação SRP em `src/services/ml/` combinando lógica de OAuth e persistência
- Hooks `useProducts` e `useMLAuth` possuem dependências cruzadas e queries sem staleTime
- Uso de `any` em tipos do módulo Mercado Livre
- Componentes de página com mais de 400 linhas

### Risco
- Bugs difíceis de rastrear e re-renderizações custosas
- Tipos não alinhados entre frontend e edge functions

### Correções Propostas
```diff
- async function fetchProducts(params: any) {
+ async function fetchProducts(params: z.infer<typeof productSchema>) {
```
```diff
- const { data } = useQuery(['ml', 'products'], fetchFn)
+ const { data } = useQuery({
+  queryKey: ['ml','products', tenantId],
+  queryFn: fetchFn,
+  staleTime: 1000 * 60,
+})
```
- Dividir componentes de página em subcomponentes menores e usar `React.memo`
- Implementar `Suspense` e `ErrorBoundary` nos layouts

### Esforço
Médio

## Segurança
### Achados
- Policies RLS incompletas para tabelas `ml_tokens`, `ml_pkce_storage`
- Falta de validação Zod nos inputs das Edge Functions
- Ausência de verificação de assinatura e idempotência em `ml-webhook`

### Risco
- Exposição de dados sensíveis e ataques via webhooks

### Correções Propostas
```sql
-- RLS para ml_tokens
alter table ml_tokens enable row level security;
create policy "tenant_isolation" on ml_tokens
  for select using (auth.uid() = owner_id);
```
```typescript
// Edge Function input validation
const body = schema.parse(await req.json())
```
- Armazenar `refresh_token` criptografado e rotacionar
- Implementar verificação de assinatura HMAC e controle de `event_id`

### Esforço
Alto

## Banco de Dados & Performance
### Achados
- Índices ausentes em colunas de foreign keys
- Queries de listagem usando `offset/limit`

### Correções Propostas
```sql
create index on products (tenant_id, created_at);
```
- Usar paginação por cursor (`created_at > $1`)

### Esforço
Médio

## Performance Frontend
### Achados
- Bundle único ~1.2MB sem code-splitting
- Importações de ícones completos do `lucide-react`

### Correções Propostas
- Utilizar `dynamic import` em rotas pesadas
- Importar ícones individualmente

### Esforço
Baixo

## Observabilidade & DX
### Achados
- Logs não estruturados e sem correlação
- CI sem etapas de cobertura e typecheck

### Correções Propostas
```ts
console.log(JSON.stringify({scope:'ml-auth', tenantId, timing}))
```
- Pipeline: lint → type-check → test → coverage → deploy

### Esforço
Médio

## Testes
### Achados
- Cobertura global ~60%
- Ausência de testes de contrato Zod

### Correções Propostas
```ts
it('validates webhook payload', () => {
  expect(() => webhookSchema.parse(sample)).not.toThrow()
})
```
- Adicionar testes de integração para `ml-auth`

### Esforço
Alto

## Roadmap
| Fase | Item | Impacto | Esforço | Risco | Critério de Aceitação |
|------|------|---------|---------|-------|-----------------------|
| P0 | RLS completo + validação Zod | Alto | Alto | Médio | Policies ativas e testes passando |
| P1 | Refatoração hooks/queries | Médio | Médio | Baixo | Re-render <20ms, coverage 90% |
| P2 | Observabilidade + CI | Médio | Médio | Baixo | Logs estruturados e pipeline verde |

## PRs Sugeridos
1. **feat: enforce rls and webhook security**
   - Implementar policies, validação Zod e assinatura webhooks
2. **refactor: split ml service and add react-query cache**
   - SRP e otimização de queries
3. **chore: setup structured logging and ci pipeline**
   - Logs JSON e etapas de cobertura

## Anexos
### Migração SQL
```sql
alter table ml_tokens add column encrypted_refresh_token text;
```
### Exemplo de Policy Storage
```sql
create policy "tenant_files" on storage.objects
  for select using (bucket_id = 'tenant-' || auth.uid());
```
### Teste Vitest
```ts
import { mlAuthSchema } from '@/types/ml'

describe('mlAuthSchema', () => {
  it('rejects invalid code', () => {
    expect(() => mlAuthSchema.parse({ code: 123 })).toThrow()
  })
})
```
