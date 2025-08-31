# 🎯 AGENTS - Diretrizes de Desenvolvimento Profissional

## 📋 Visão Geral

Este documento estabelece padrões profissionais para desenvolvimento no **Catalog Maker Hub**, com foco na integração **Mercado Livre** seguindo a **Metodologia Vibe Code**.

---

## 🚀 Metodologia Vibe Code

### **Princípios Fundamentais**
Seguimos a **Metodologia Vibe Code** conforme descrito em `docs/development/vibe-code-methodology.md`:

- 🎯 **Code First, Polish Later**: Funcionalidade básica primeiro, refinamento depois
- 📈 **Progressive Enhancement**: MVP → Testing → Production → Optimization  
- 🌍 **Real World Ready**: Sempre testar com dados reais
- ⚡ **Ship Fast, Code Smart**: Entregas frequentes com qualidade técnica

### **Aplicação Específica - Integração ML**
```typescript
// ✅ Padrão Vibe Code para Edge Functions
export default async function handler(req: Request) {
  // 1. Funcionalidade básica primeiro
  const result = await processMLRequest(req);
  
  // 2. Logging para debugging real
  console.log('ML Integration:', { 
    action: req.action, 
    success: result.success,
    timing: performance.now() 
  });
  
  // 3. Response direto, polish depois
  return new Response(JSON.stringify(result), {
    headers: corsHeaders,
    status: result.success ? 200 : 400
  });
}
```

---

## 🔧 Padrões de Desenvolvimento

### **1. Convenções de Commit**
Utilize [Conventional Commits](https://www.conventionalcommits.org) com tipos específicos:

**Tipos Principais:**
- `feat`: Novas funcionalidades ML
- `fix`: Correções de bugs na integração
- `docs`: Alterações na documentação
- `refactor`: Refatorações de código ML
- `test`: Testes para Edge Functions
- `chore`: Manutenção e configurações

**Formato Obrigatório:** `<type>: short description`

**Exemplos Específicos:**
```bash
feat: implement ml-auth OAuth flow
fix: resolve token refresh in ml-sync-v2
docs: update ml integration API reference
refactor: optimize ml-webhook processing
test: add unit tests for MLAuthService
chore: update ml credentials configuration
```

### **2. Nomenclatura Padronizada**

**Arquivos e Diretórios (inglês + kebab-case):**
```
src/
├── services/ml/           # Serviços ML específicos
├── hooks/useML*          # React hooks ML
├── components/ml/        # Componentes ML
├── types/ml/            # TypeScript types ML
└── utils/ml/            # Utilitários ML

supabase/functions/
├── ml-auth/             # Edge Function auth
├── ml-sync-v2/          # Edge Function sync
└── ml-webhook/          # Edge Function webhook
```

**Código (camelCase/PascalCase):**
```typescript
// ✅ Padrões corretos
class MLAuthService { }
interface MLProductMapping { }
const mlAuthToken = 'xxx';
function syncProductToML() { }

// ❌ Evitar
class MercadoLivreAuth { }
const mercado_livre_token = 'xxx';
```

### **3. Estrutura de Código ML**

**Edge Functions Pattern:**
```typescript
// supabase/functions/ml-auth/index.ts
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export default async function handler(req: Request) {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    
    // Action dispatcher
    switch (action) {
      case 'start': return handleOAuthStart(params);
      case 'callback': return handleOAuthCallback(params);
      case 'refresh': return handleTokenRefresh(params);
      case 'status': return handleAuthStatus(params);
      default: throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('ML Auth Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: corsHeaders, status: 400 }
    );
  }
}
```

**React Query Hooks Pattern:**
```typescript
// src/hooks/useMLAuth.ts
export function useMLAuth() {
  const queryClient = useQueryClient();
  
  const { data: authStatus, isLoading } = useQuery({
    queryKey: ['ml-auth-status'],
    queryFn: () => MLAuthService.checkStatus(),
    refetchInterval: 5 * 60 * 1000, // 5 min
    staleTime: 60 * 1000 // 1 min
  });
  
  const connectMutation = useMutation({
    mutationFn: MLAuthService.startAuth,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-auth-status'] });
      toast.success('Mercado Livre conectado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao conectar: ${error.message}`);
    }
  });
  
  return {
    isConnected: authStatus?.connected || false,
    isLoading,
    connect: connectMutation.mutate,
    isConnecting: connectMutation.isPending
  };
}
```

---

## 📝 Formatação e Documentação

### **Markdown Padrão**
- Títulos com `#` seguidos por linha em branco
- Máximo 120 caracteres por linha
- Listas não ordenadas com `-`, numeradas com `1.`
- Finalizar arquivos com linha em branco única
- Blocos de código com identificador de linguagem

### **Documentação Técnica**
```markdown
# 🎯 Título Principal

## 📋 Seção com Emoji

### **Subsection em Bold**

Texto explicativo claro e objetivo.

```typescript
// Exemplo de código sempre com contexto
const example = 'valor de exemplo';
```

**Links Importantes:**
- [API Reference](../development/api-reference.md)
- URL Produção: https://peepers-hub.lovable.app
```

---

## 🧪 Estratégia de Testes

### **Cobertura Obrigatória**
- **Edge Functions**: 90% cobertura mínima
- **Services ML**: 85% cobertura mínima  
- **React Hooks**: 80% cobertura mínima
- **Componentes**: 70% cobertura mínima

### **Testes Antes de Commit**
```bash
# Verificações obrigatórias
npm run lint              # ESLint + Prettier
npm run type-check        # TypeScript
npm test                  # Jest + Testing Library
npm run test:coverage     # Verificar cobertura

# Testes específicos ML
npm test -- --testPathPattern=ml
npm test -- src/services/ml/
```

### **Padrão de Teste ML**
```typescript
// tests/services/ml-auth.test.ts
describe('MLAuthService', () => {
  beforeEach(() => {
    // Setup mock do Supabase
    mockSupabase.functions.invoke.mockClear();
  });

  it('should start OAuth flow successfully', async () => {
    // Arrange
    const tenantId = 'test-tenant-id';
    mockSupabase.functions.invoke.mockResolvedValue({
      data: { auth_url: 'https://auth.ml.com/...' }
    });

    // Act
    const result = await MLAuthService.startAuth(tenantId);

    // Assert
    expect(result).toHaveProperty('auth_url');
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('ml-auth', {
      body: { action: 'start', tenant_id: tenantId }
    });
  });
});
```

---

## 📊 Workflow de Desenvolvimento

### **1. Feature Development**
```bash
# Branch naming
git checkout -b feat/ml-product-sync
git checkout -b fix/ml-webhook-timeout
git checkout -b docs/update-ml-api-reference

# Development cycle
npm run dev                # Desenvolvimento local
npm test -- --watch       # Testes em watch mode
npm run lint:fix          # Auto-fix de linting
```

### **2. Pre-commit Checklist**
- [ ] ✅ Funcionalidade implementada e testada
- [ ] ✅ Testes passando (`npm test`)
- [ ] ✅ Linting sem erros (`npm run lint`)
- [ ] ✅ TypeScript sem erros (`npm run type-check`)
- [ ] ✅ Documentação atualizada se necessário
- [ ] ✅ Status real atualizado em `docs/development/implementation-status.md`

### **3. Pull Request**
```markdown
## 🎯 Descrição
Implementa sincronização de produtos ML seguindo Vibe Code

## ✅ Checklist
- [x] Funcionalidade básica implementada
- [x] Testes adicionados/atualizados  
- [x] Documentação atualizada
- [x] Edge Function deployável
- [x] Logs de debug implementados

## 🧪 Testes
- Testado com produtos reais ML
- Performance < 30s por produto
- Error handling robusto

## 📋 Próximos Passos
- Polish da UI (próximo sprint)
- Otimizações de performance (backlog)
```

---

## 🔍 Code Review Guidelines

### **Revisão Obrigatória**
1. **Funcionalidade**: Atende aos requisitos ML?
2. **Qualidade**: Segue padrões Vibe Code?
3. **Testes**: Cobertura adequada e passando?
4. **Documentação**: Atualizada e consistente?
5. **Performance**: Aceitável para produção?
6. **Segurança**: Tokens seguros, RLS correto?

### **Aprovação Necessária**
- **1 mantenedor** mínimo para approval
- **Todos os checks** passando (CI/CD)
- **Documentação** sincronizada com código

---

## 📈 Monitoramento e Qualidade

### **Métricas de Qualidade**
```typescript
// Exemplo de métricas automáticas
const qualityMetrics = {
  edgeFunctionLatency: '<2s average',
  testCoverage: '>85%',
  lintingErrors: '0',
  typeScriptErrors: '0',
  documentationCoverage: '>90%'
};
```

### **Status Real do Projeto**
Sempre manter atualizado em `docs/development/implementation-status.md`:
- **Implementado**: O que está funcionando
- **Em Desenvolvimento**: O que está sendo feito
- **Pendente**: O que está no backlog
- **Bloqueadores**: O que está impedindo progresso

---

## 🎯 Definition of Done

### **Para Feature ser "Done":**
- ✅ **Funcionalidade**: Implementada e testada com dados reais
- ✅ **Testes**: Cobertura adequada e passando
- ✅ **Documentação**: Atualizada e revisada  
- ✅ **Performance**: Dentro dos targets
- ✅ **Security**: RLS e tokens seguros
- ✅ **Deploy**: Funcionando em produção
- ✅ **Monitoring**: Logs e métricas implementadas

---

> 🚀 **Vibe Code**: Ship Fast, Code Smart, Scale Real - Desenvolvimento pragmático para entregar valor real aos usuários do Catalog Maker Hub.

