# 📋 Integração Mercado Livre - Catalog Maker Hub

## 🎯 Visão Geral

Documentação completa para integração entre **Catalog Maker Hub** e **API Mercado Livre**, permitindo sincronização bidireccional de produtos, gestão de vendas e automatização de processos de e-commerce.

**Stack Tecnológico:**
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS + Shadcn/ui
- Backend: Supabase (PostgreSQL + Edge Functions + Auth)
- URL Produção: https://peepers-hub.lovable.app

## 🚀 Quick Start (15 minutos)

### 1. Pré-requisitos
```bash
# Verificar se o projeto está funcionando
npm run dev

# Acessar: https://peepers-hub.lovable.app
# Login com credenciais de super_admin
```

### 2. Configuração Mercado Livre
```bash
# 1. Criar aplicação no DevCenter ML
# 2. Obter Client ID e Client Secret
# 3. Configurar URL de redirecionamento:
#    https://peepers-hub.lovable.app/api/ml/callback
```

### 3. Implementação Inicial
```bash
# Criar Edge Functions básicas
supabase functions new ml-auth
supabase functions new ml-sync
supabase functions new ml-webhook

# Aplicar migrações de banco
# (Ver docs/development/database-schema.md)
```

## 📚 Estrutura da Documentação

Todas as novas páginas devem seguir a hierarquia abaixo e utilizar `https://peepers-hub.lovable.app` para URLs de produção.

### 🔧 [Desenvolvimento](./development/)
- [Environment Setup](./development/setup.md) - Configuração completa do ambiente
- [Database Schema](./development/database-schema.md) - Schema detalhado das tabelas
- [API Reference](./development/api-reference.md) - Endpoints e payloads
- [Testing Strategy](./development/testing.md) - Estratégia de testes

### 🔗 [Integração](./integration/)
- [Overview](./integration/overview.md) - Arquitetura geral da integração
- [Authentication](./integration/authentication.md) - Setup OAuth 2.0
- [Products Sync](./integration/products-sync.md) - Sincronização de produtos
- [Sales Management](./integration/sales-management.md) - Gestão de vendas
- [Webhooks](./integration/webhooks.md) - Configuração de webhooks

### 🚀 [Deploy](./deployment/)
- [Production](./deployment/production.md) - Deploy para produção
- [Monitoring](./deployment/monitoring.md) - Monitoramento e logs

### 📋 [Gestão de Projeto](./project-management/)
- [Roadmap](./project-management/roadmap.md) - Roadmap detalhado
- [User Stories](./project-management/user-stories.md) - Épicos e stories
- [Milestones](./project-management/milestones.md) - Marcos do projeto

### 🆘 [Suporte](./support/)
- [Troubleshooting](./support/troubleshooting.md) - Solução de problemas
- [FAQ](./support/faq.md) - Perguntas frequentes
- [Changelog](./support/changelog.md) - Histórico de mudanças

## 🎯 Status Atual

| Componente | Status | Prioridade |
|------------|--------|------------|
| 🔐 OAuth Setup | ❌ Não implementado | Alta |
| 📦 Sync Produtos | ❌ Não implementado | Alta |
| 📈 Webhooks Vendas | ❌ Não implementado | Média |
| 🎨 Interface UI | ❌ Não implementado | Média |
| 📊 Dashboard | ❌ Não implementado | Baixa |

## ⏱️ Roadmap Resumido

- **Sprint 1 (2 semanas)**: Autenticação OAuth + Base de dados
- **Sprint 2 (3 semanas)**: Sincronização de produtos  
- **Sprint 3 (2 semanas)**: Webhooks e vendas
- **Sprint 4 (1 semana)**: Interface e testes

**Total estimado: 8 semanas**

## 🔧 Contribuição

1. Leia a documentação completa
2. Configure o ambiente local
3. Implemente seguindo os padrões estabelecidos
4. Execute testes antes de submeter
5. Atualize documentação se necessário

## 📞 Suporte

- **Issues**: Use GitHub Issues para bugs
- **Documentação**: Atualize this README conforme necessário
- **Dúvidas**: Consulte FAQ ou crie uma issue

---

> 📖 **Última atualização**: Janeiro 2025  
> 🔄 **Versão da documentação**: 2.0  
> ✅ **Status**: Pronto para implementação