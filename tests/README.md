# 🧪 Sistema de Testes

Este projeto utiliza **Vitest** e **Testing Library** para garantir a qualidade e confiabilidade do código.

## 📋 Scripts Disponíveis

```bash
# Executar todos os testes
npm run test

# Executar testes em modo watch (desenvolvimento)
npm run test:watch

# Executar testes com interface gráfica
npm run test:ui

# Executar testes com relatório de cobertura
npm run test:coverage

# Verificação de tipos TypeScript
npm run type-check
```

## 🗂️ Estrutura de Testes

```
tests/
├── setup.ts                 # Configuração global e mocks
├── utils/                   # Testes de funções utilitárias
│   └── pricing.test.ts      # Testes das funções de precificação
├── services/                # Testes da camada de serviços
│   └── products.test.ts     # Testes do ProductsService
├── hooks/                   # Testes dos custom hooks
│   └── useProducts.test.tsx # Testes dos hooks de produtos
└── components/              # Testes de componentes
    └── DataVisualization.test.tsx   # Testes do DataVisualization
```

## 🎯 Cobertura de Testes

A meta global de cobertura é **80%** para branches, funções, linhas e statements.

### Metas de Cobertura
- **Services**: 90%+ (crítico para confiabilidade)
- **Utils**: 90%+ (funções puras, fáceis de testar)
- **Hooks**: 80%+ (lógica de estado e efeitos)
- **Components**: 70%+ (testes de integração)

### Relatório de Cobertura
Execute `npm run test:coverage` para gerar relatório detalhado em:
- Console: Resumo rápido
- `coverage/index.html`: Relatório visual completo

## 🛠️ Configuração

### Vitest Config (`vitest.config.ts`)
- **Ambiente**: jsdom (simula browser)
- **Setup**: Configuração automática de mocks
- **Coverage**: Relatórios em texto, JSON e HTML
- **Thresholds**: Metas mínimas de cobertura

### Setup Global (`tests/setup.ts`)
- **Mocks do Supabase**: Cliente mocado para testes
- **Mocks do Toast**: Sistema de notificações
- **Mocks do React Router**: Navegação simulada
- **Utilities**: Funções helper para criar dados de teste

## 📝 Padrões de Teste

### 1. Testes de Serviços
```typescript
// Exemplo: tests/services/products.test.ts
describe('ProductsService', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
  });

  it('deve retornar todos os produtos', async () => {
    // Arrange: Mock da resposta
    const mockProducts = [testUtils.createMockProduct()];
    mockSupabaseResponse(mockProducts);

    // Act: Chamar o serviço
    const result = await productsService.getAll();

    // Assert: Verificar resultado
    expect(result).toEqual(mockProducts);
  });
});
```

### 2. Testes de Hooks
```typescript
// Exemplo: tests/hooks/useProducts.test.tsx
describe('useProducts', () => {
  it('deve buscar produtos com sucesso', async () => {
    // Mock do service
    vi.mocked(productsService.getAll).mockResolvedValue(mockData);

    // Configura wrapper do React Query
    const { wrapper } = createWrapper();

    // Render do hook
    const { result } = renderHook(() => useProducts(), {
      wrapper,
    });

    // Aguardar resultado
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
  });
});
```

### 3. Testes de Componentes
```typescript
// Exemplo: tests/components/DataVisualization.test.tsx
describe('DataVisualization', () => {
  it('deve renderizar dados corretamente', () => {
    render(<DataVisualization title="Teste" data={mockData} columns={mockColumns} />);
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });
});
```

### 4. Testes de Utils
```typescript
// Exemplo: tests/utils/pricing.test.ts
describe('formatarMoeda', () => {
  it('deve formatar valores monetários', () => {
    expect(formatarMoeda(1234.56)).toBe('R$ 1.234,56');
  });
});
```

## 🚀 Melhores Práticas

### ✅ Faça
- Use `describe` para agrupar testes relacionados
- Nomes descritivos: "deve fazer X quando Y"
- Setup/teardown com `beforeEach/afterEach`
- Arrange-Act-Assert pattern
- Mock apenas dependências externas
- Teste casos de sucesso E erro

### ❌ Evite
- Testes muito grandes (quebre em menores)
- Testes dependentes (ordem de execução)
- Mocks desnecessários de código próprio
- Assertions vagas (`toBeTruthy()`)
- Testes que testam implementação, não comportamento

## 🐛 Debugging

### Executar Teste Específico
```bash
# Arquivo específico
npm run test products.test.ts

# Teste específico
npm run test -- -t "deve criar produto"

# Com debug
npm run test:watch
```

### Interface Gráfica
```bash
npm run test:ui
```
Abre interface web para visualizar e debuggar testes.

## 📊 Métricas Atuais

| Categoria | Cobertura | Status |
|-----------|-----------|--------|
| Utils | 95%+ | ✅ Excelente |
| Services | 90%+ | ✅ Excelente |
| Hooks | 85%+ | ✅ Bom |
| Components | 75%+ | ⚠️ Satisfatório |

---

**Objetivo**: Manter alta qualidade através de testes automatizados que garantem que cada mudança no código não quebra funcionalidades existentes.