# Monitoramento

Práticas de monitoramento e coleta de logs após o deploy em produção.

## Coleta de Logs

### Edge Functions

- **CLI:**
  ```bash
  supabase functions logs <nome-da-function>
  ```
  Exibe as execuções recentes com duração, status e eventuais erros.
- **Dashboard:** navegue em **Project → Logs → Edge Functions** para visualizar logs em tempo real.

### Banco de Dados

- **CLI:**
  ```bash
  supabase logs database
  ```
  Retorna consultas lentas, erros de conexão e eventos de replicação.
- **Dashboard:** em **Project → Logs → Database** é possível filtrar por severidade ou tabela.

## Métricas Principais

- **Latência:** tempo de resposta de cada Edge Function e de consultas SQL.
- **Erros:** quantidade de requisições com status 4xx/5xx ou exceções no Postgres.
- **Uso de Recursos:** CPU e memória das Edge Functions, conexões ativas e I/O do banco.

## Integração com Ferramentas Externas

- **Supabase Dashboard:** configura painéis customizados em **Reports** para acompanhar as métricas acima.
- **Alertas:** utilize integrações nativas (Slack, Discord, e-mail) em **Project → Alerts** para receber notificacões quando limites de latência, erros ou recursos forem excedidos.

