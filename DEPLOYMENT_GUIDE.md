# Guia de Deploy - Catalog Maker Hub com Integração Mercado Livre

Este guia fornece instruções detalhadas para fazer o deploy da aplicação Catalog Maker Hub com a integração do Mercado Livre em ambiente de produção.

## Pré-requisitos

- Conta no Supabase (para backend e banco de dados)
- Conta no Vercel, Netlify ou similar (para frontend)
- Aplicação criada no DevCenter do Mercado Livre
- Domínio configurado (recomendado para produção)

## 1. Configuração do Supabase

### 1.1. Criação do Projeto
1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Anote a URL do projeto e a chave anônima (anon key)

### 1.2. Configuração do Banco de Dados
Execute os seguintes scripts SQL no editor SQL do Supabase:

```sql
-- Tabela para tokens de autenticação do ML
CREATE TABLE ml_auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para mapeamento de produtos
CREATE TABLE ml_product_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id),
  local_product_id UUID REFERENCES products(id),
  ml_item_id TEXT NOT NULL,
  ml_permalink TEXT,
  sync_status TEXT DEFAULT 'pending',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para log de sincronização
CREATE TABLE ml_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id),
  operation_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  request_data JSONB,
  response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para configurações do ML
CREATE TABLE ml_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id),
  app_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  redirect_url TEXT NOT NULL,
  webhook_url TEXT,
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_frequency_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 1.3. Deploy das Edge Functions
1. Instale a CLI do Supabase:
   ```bash
   npm install -g supabase
   ```

2. Faça login e vincule ao projeto:
   ```bash
   supabase login
   supabase link --project-ref <seu-project-ref>
   ```

3. Deploy das funções:
   ```bash
   supabase functions deploy sync-products-to-ml
   supabase functions deploy ml-webhook-handler
   ```

## 2. Configuração do Frontend

### 2.1. Variáveis de Ambiente
Crie um arquivo `.env.production` com:

```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-chave-anon>
VITE_ML_CLIENT_ID=<seu-client-id-ml>
VITE_APP_URL=https://peepers-hub.lovable.app
```

### 2.2. Build da Aplicação
```bash
npm run build
```

### 2.3. Deploy no Vercel
1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente no painel do Vercel
3. O deploy será automático a cada push na branch main

## 3. Configuração do Mercado Livre

### 3.1. URLs de Produção
No DevCenter do Mercado Livre, atualize:

- **URL de Redirecionamento**: `https://peepers-hub.lovable.app/integrations/mercadolivre/callback`
- **URL de Webhook**: `https://peepers-hub.lovable.app/api/webhooks/mercadolivre`

### 3.2. Configuração de Domínio
Se usando domínio personalizado, configure:
1. DNS apontando para o Vercel
2. Certificado SSL (automático no Vercel)
3. Atualize as URLs no Mercado Livre

## 4. Monitoramento e Logs

### 4.1. Logs do Supabase
- Acesse o painel do Supabase > Logs
- Configure alertas para erros críticos

### 4.2. Monitoramento de Webhooks
- Monitore a tabela `ml_sync_log` para erros
- Configure alertas para falhas de sincronização

## 5. Backup e Segurança

### 5.1. Backup do Banco
- Configure backups automáticos no Supabase
- Teste a restauração periodicamente

### 5.2. Segurança
- Use HTTPS em todas as comunicações
- Mantenha as chaves secretas seguras
- Configure Row Level Security (RLS) no Supabase

## 6. Troubleshooting

### Problemas Comuns

**Erro de CORS**: Verifique se o domínio está configurado corretamente no Supabase.

**Webhooks não funcionando**: Verifique se a URL está acessível e retorna 200 OK.

**Falha na autenticação**: Verifique se as credenciais do ML estão corretas.

## 7. Manutenção

### Atualizações
1. Teste em ambiente de staging primeiro
2. Faça backup antes de atualizações importantes
3. Monitore logs após deploy

### Performance
- Monitore uso de recursos no Supabase
- Otimize queries se necessário
- Configure cache quando apropriado

## 8. Checklist Pós-Deploy

- [ ] Domínio configurado e servindo o frontend via HTTPS
- [ ] Logs do Supabase e do provedor de hospedagem sem erros
- [ ] Smoke tests executados (login, sincronização com ML e webhooks)

