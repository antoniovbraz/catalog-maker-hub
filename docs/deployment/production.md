# Deploy em Produção

Guia completo para deploy da integração Mercado Livre em produção.

## Pré-requisitos

- [ ] Conta Supabase configurada
- [ ] Aplicação registrada no DevCenter ML
- [ ] Domínio customizado configurado
- [ ] SSL/TLS certificado válido
- [ ] Monitoramento configurado

## Configuração Supabase

### 1. Criação do Projeto

```bash
# Criar novo projeto Supabase
supabase projects create catalog-maker-hub-prod

# Configurar projeto local
supabase init
supabase link --project-ref <project-ref>
```

### 2. Configuração de Secrets

```bash
# Definir secrets de produção
supabase secrets set \
  ML_CLIENT_ID="<client-id-prod>" \
  ML_CLIENT_SECRET="<client-secret-prod>" \
  ML_REDIRECT_URL="https://peepers-hub.lovable.app/auth/ml/callback" \
  ML_WEBHOOK_SECRET="<webhook-secret-prod>" \
  OPENAI_API_KEY="<openai-key>"
```

### 3. Deploy de Edge Functions

```bash
# Deploy de todas as Edge Functions
supabase functions deploy ml-auth
supabase functions deploy ml-sync  
supabase functions deploy ml-webhook

# Verificar deploy
supabase functions list
```

### 4. Aplicar Migrações

```bash
# Aplicar schema em produção
supabase db push

# Verificar status das migrações
supabase migration list
```

## Configuração Mercado Livre

### 1. Aplicação de Produção

No [DevCenter](https://developers.mercadolivre.com.br/):

1. **Criar aplicação de produção**
   - Nome: "Catalog Maker Hub - Produção"
   - Callback URL: `https://peepers-hub.lovable.app/auth/ml/callback`
   - Escopos: `read`, `write`, `offline_access`

2. **Configurar Webhooks**
   - URL: `https://ngkhzbzynkhgezkqykeb.supabase.co/functions/v1/ml-webhook`
   - Tópicos: `items`, `orders_v2`, `payments`, `questions`
   - Validar conectividade

### 2. Configuração de Domínio

```bash
# Configurar domínio customizado (opcional)
# DNS A Record: peepers-hub.lovable.app -> IP_LOVABLE
# SSL: Certificado automático via Lovable
```

## Deploy Frontend

### 1. Configuração de Ambiente

```typescript
// src/lib/config.ts - Produção
export const config = {
  supabase: {
    url: 'https://ngkhzbzynkhgezkqykeb.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
  ml: {
    clientId: process.env.VITE_ML_CLIENT_ID!,
    redirectUrl: 'https://peepers-hub.lovable.app/auth/ml/callback',
    apiBaseUrl: 'https://api.mercadolibre.com',
  },
  app: {
    name: 'Catalog Maker Hub',
    version: '1.0.0',
    environment: 'production',
  }
} as const
```

### 2. Build e Deploy

```bash
# Build otimizado para produção
npm run build

# Deploy via Lovable (automático)
# Ou deploy manual se necessário
npm run deploy
```

## Configuração DNS e SSL

### 1. DNS Records

```dns
# Registro A para domínio principal
peepers-hub.lovable.app.     A     <IP_LOVABLE>

# Registro CNAME para subdomínios (se necessário)
api.peepers-hub.lovable.app. CNAME <SUPABASE_PROJECT>.supabase.co.
```

### 2. SSL/TLS

```nginx
# Configuração SSL (automática via Lovable)
# Certificado Let's Encrypt renovado automaticamente
ssl_certificate     /path/to/cert.pem;
ssl_certificate_key /path/to/key.pem;
ssl_protocols       TLSv1.2 TLSv1.3;
ssl_ciphers         HIGH:!aNULL:!MD5;
```

## Monitoramento e Observabilidade

### 1. Supabase Dashboard

```typescript
// Configurar alertas de produção
const productionAlerts = {
  database: {
    connections: { threshold: 80, alert: 'email' },
    queryTime: { threshold: 1000, alert: 'slack' },
    errorRate: { threshold: 5, alert: 'email' }
  },
  functions: {
    responseTime: { threshold: 5000, alert: 'slack' },
    errorRate: { threshold: 2, alert: 'email' },
    memoryUsage: { threshold: 90, alert: 'email' }
  }
}
```

### 2. Logs Centralizados

```sql
-- Query para monitorar erros críticos
SELECT 
  created_at,
  operation_type,
  entity_type,
  status,
  error_details->'message' as error_message
FROM ml_sync_log 
WHERE status = 'error' 
  AND created_at >= now() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### 3. Métricas de Negócio

```sql
-- Dashboard de métricas em tempo real
SELECT 
  tenant_id,
  total_products,
  synced_products,
  pending_products,
  error_products,
  orders_this_month,
  revenue_this_month,
  connection_status
FROM ml_integration_status
WHERE connection_status = 'connected';
```

## Backup e Disaster Recovery

### 1. Backup Automatizado

```bash
# Configurar backup diário via Supabase
# Backup é automático para planos Pro+
# Retention: 7 days (Pro), 30 days (Pro+)

# Backup manual se necessário
supabase db dump --file backup-$(date +%Y%m%d).sql
```

### 2. Estratégia de Recovery

```bash
# RTO (Recovery Time Objective): < 1 hora
# RPO (Recovery Point Objective): < 15 minutos

# Processo de recovery
1. Identificar problema
2. Avaliar impacto  
3. Executar rollback se necessário
4. Restaurar backup
5. Validar integridade
6. Comunicar resolução
```

## Validação Pós-Deploy

### 1. Health Checks

```bash
# Verificar saúde das Edge Functions
curl -f https://ngkhzbzynkhgezkqykeb.supabase.co/functions/v1/ml-auth/health

# Verificar conectividade ML
curl -f https://api.mercadolibre.com/sites/MLB

# Validar webhooks
curl -X POST https://ngkhzbzynkhgezkqykeb.supabase.co/functions/v1/ml-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### 2. Smoke Tests

```typescript
// Testes críticos pós-deploy
const smokeTests = [
  'User can log in',
  'ML OAuth flow works',
  'Product sync completes',
  'Webhook processing works',
  'Dashboard loads correctly'
]

// Executar via Playwright ou Cypress
npm run test:smoke
```

### 3. Performance Validation

```bash
# Load testing básico
npx lighthouse https://peepers-hub.lovable.app --output=json

# Verificar métricas core
- First Contentful Paint < 2s
- Largest Contentful Paint < 4s  
- Cumulative Layout Shift < 0.1
- First Input Delay < 100ms
```

## Rollback Strategy

### 1. Rollback Automático

```bash
# Se health checks falharem
if [ $HEALTH_CHECK_FAIL ]; then
  echo "Health check failed, rolling back..."
  supabase functions deploy ml-auth --version previous
  supabase functions deploy ml-sync --version previous
  supabase functions deploy ml-webhook --version previous
fi
```

### 2. Rollback Manual

```bash
# Rollback de Edge Functions
supabase functions list --show-versions
supabase functions deploy ml-auth --version <previous-version>

# Rollback de migrações (cuidado!)
supabase migration down <migration-id>

# Rollback de frontend via Lovable
# Usar interface web para reverter para versão anterior
```

## Checklist Pós-Deploy

### Infraestrutura
- [ ] Supabase project configurado
- [ ] Edge Functions deployadas
- [ ] Database migrado  
- [ ] Secrets configurados
- [ ] SSL/TLS ativo
- [ ] DNS resolvendo

### Aplicação
- [ ] Frontend carregando
- [ ] Autenticação funcionando
- [ ] ML OAuth funcional
- [ ] Webhooks recebendo
- [ ] Dashboard operacional

### Monitoramento
- [ ] Alertas configurados
- [ ] Logs fluindo
- [ ] Métricas coletadas
- [ ] Health checks ativos
- [ ] Backup rodando

### Documentação
- [ ] Runbooks atualizados
- [ ] Procedures documentados
- [ ] Contatos de emergência
- [ ] Escalation paths definidos

## Contatos de Emergência

### Suporte Técnico
- **Supabase Support**: support@supabase.io
- **Mercado Livre Developers**: developers@mercadolibre.com
- **Lovable Support**: support@lovable.dev

### Time Interno
- **Tech Lead**: tech-lead@company.com
- **DevOps**: devops@company.com  
- **Product Owner**: po@company.com

### Escalation Process
1. **L1**: Verificar status pages e logs
2. **L2**: Contatar suporte técnico
3. **L3**: Escalation para management
4. **L4**: Acionamento de emergência