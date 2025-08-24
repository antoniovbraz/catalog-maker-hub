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
# Instalar dependências
npm install

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

### 🎪 [Vibe Code Methodology](./development/vibe-code-methodology.md)
- **Desenvolvimento Pragmático**: Ship Fast, Code Smart, Scale Real
- **Progressive Enhancement**: MVP → Polish → Production  
- **Real World Ready**: Testa com dados reais desde o início

### 🔧 [Desenvolvimento](./development/)
- [Vibe Code Methodology](./development/vibe-code-methodology.md) - Nossa abordagem de desenvolvimento
- [Environment Setup](./development/setup.md) - Configuração completa do ambiente
- [Database Schema](./development/database-schema.md) - ✅ Schema implementado e funcional
- [API Reference](./development/api-reference.md) - Endpoints e payloads
- [Testing Strategy](./development/testing.md) - Estratégia de testes

### 🔗 [Integração](./integration/)
- [Overview](./integration/overview.md) - Arquitetura geral da integração
- [ML API Documentation](./integration/ml-api-documentation.md) - ✅ Edge Functions implementadas
- [Authentication](./integration/authentication.md) - ✅ OAuth 2.0 funcional
- [Products Sync](./integration/products-sync.md) - 🔄 Sincronização de produtos
- [Sales Management](./integration/sales-management.md) - 🔄 Gestão de vendas  
- [Webhooks](./integration/webhooks.md) - ✅ Handler implementado

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

## 🎯 Status Real da Implementação

| Componente | Status | Implementado | Próximos Passos |
|------------|--------|--------------|----------------|
| 🗄️ **Database Schema** | ✅ **Completo** | Edge Functions + RLS | Otimização de índices |
| 🔐 **OAuth Infrastructure** | ✅ **Implementado** | ml-auth Edge Function | Testing + UI Integration |
| 📦 **Sync Infrastructure** | ✅ **Base Pronta** | ml-sync Edge Function | Product Mapping Logic |
| 📈 **Webhook Handler** | ✅ **Implementado** | ml-webhook Edge Function | Order Processing |
| 🛡️ **Security & RLS** | ✅ **Implementado** | Todas as tabelas ML | Audit Logs |
| 🎨 **UI Integration** | 🔄 **Em Desenvolvimento** | Base components | ML Integration Pages |

## ⏱️ Roadmap Atualizado - Metodologia Vibe Code

### **🚀 FASE ATUAL: Integration & Testing (2 semanas)**
- **OAuth Testing**: Validar fluxo completo de autenticação
- **Product Sync Logic**: Implementar mapeamento Hub ↔ ML  
- **UI Components**: Criar interface de gestão ML
- **Error Handling**: Implementar tratamento robusto

### **📈 PRÓXIMA FASE: Production Ready (2 semanas)**
- **Webhook Processing**: Automatizar vendas e estoque
- **Dashboard Analytics**: Métricas ML integradas
- **Performance**: Otimização e monitoring
- **Documentation**: Guias práticos para usuários

**Status Geral: 70% Implementado | ETA Produção: 4 semanas**

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