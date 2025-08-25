# Deploy em Produção

Procedimento para publicar o Catalog Maker Hub em ambiente de produção.

## Pré-requisitos

- `.env.production` configurado com:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_ML_CLIENT_ID`
  - `VITE_APP_URL`
- Projeto Supabase criado e com as tabelas do Catalog Maker Hub
- Node.js 18+ instalado e dependências instaladas (`npm install`)

## Passos de Deploy

1. **Build do frontend**
   ```bash
   npm run build
   ```
2. **Upload dos arquivos gerados**
   - Faça o upload da pasta `dist/` para seu provedor (Vercel, Netlify, etc.)
3. **Configuração das Edge Functions**
   ```bash
   supabase functions deploy sync-products-to-ml
   supabase functions deploy ml-webhook-handler
   ```

## Checklist Pós-Deploy

- [ ] Domínio aponta para o frontend com HTTPS válido
- [ ] Logs do Supabase sem erros críticos
- [ ] Smoke tests executados (login, listagem de produtos, webhook)

