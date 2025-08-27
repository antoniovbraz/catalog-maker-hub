# Estratégia de Testes

Estratégia completa de testes para a integração Mercado Livre.

## Visão Geral

Nossa estratégia de testes segue a pirâmide de testes:
- **70% Testes Unitários**: Funções, utils, services
- **20% Testes de Integração**: Edge Functions, database
- **10% Testes E2E**: Fluxos críticos completos

## Configuração do Ambiente

### Setup Vitest + Testing Library

```bash
# Instalar dependências de teste
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event jsdom
```

### Configuração Base

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 80,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

## Comandos de Teste

```bash
# Executar todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Cobertura de testes
npm run test:coverage

# UI do Vitest
npm run test:ui

# Lint + Type check + Tests
npm run test:all
```

## Testes Unitários

### Services Layer

```typescript
// tests/services/ml-auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MLAuthService } from '@/services/ml-auth'

describe('MLAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exchangeCodeForTokens', () => {
    it('should exchange authorization code for tokens', async () => {
      const mockResponse = {
        access_token: 'mock_token',
        refresh_token: 'mock_refresh',
        expires_in: 3600
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await MLAuthService.exchangeCodeForTokens('auth_code')
      
      expect(result.access_token).toBe('mock_token')
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/oauth/token'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded'
          })
        })
      )
    })

    it('should handle API errors correctly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'invalid_grant' })
      })

      await expect(
        MLAuthService.exchangeCodeForTokens('invalid_code')
      ).rejects.toThrow('OAuth error: invalid_grant')
    })
  })
})
```

### React Hooks

```typescript
// tests/hooks/useMLAuth.test.ts
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useMLAuth } from '@/hooks/useMLAuth'

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    insert: vi.fn(() => Promise.resolve({ data: [], error: null }))
  }))
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}))

describe('useMLAuth', () => {
  it('should handle OAuth callback correctly', async () => {
    const { result } = renderHook(() => useMLAuth())

    await act(async () => {
      await result.current.handleOAuthCallback('auth_code_123')
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(mockSupabase.from).toHaveBeenCalledWith('ml_auth_tokens')
  })
})
```

### Utils Functions

```typescript
// tests/utils/ml-pricing.test.ts
import { describe, it, expect } from 'vitest'
import { calculateMLPrice, formatMLPrice } from '@/utils/ml-pricing'

describe('ML Pricing Utils', () => {
  describe('calculateMLPrice', () => {
    it('should calculate price with commission correctly', () => {
      const result = calculateMLPrice({
        baseCost: 100,
        commission: 0.12, // 12%
        fixedFee: 5,
        shipping: 10,
        margin: 0.20 // 20%
      })

      expect(result.suggestedPrice).toBeCloseTo(171.43, 2)
      expect(result.finalMargin).toBeCloseTo(20, 1)
    })

    it('should handle zero commission', () => {
      const result = calculateMLPrice({
        baseCost: 100,
        commission: 0,
        fixedFee: 0,
        shipping: 0,
        margin: 0.30
      })

      expect(result.suggestedPrice).toBeCloseTo(142.86, 2)
    })
  })
})
```

## Testes de Integração

### Edge Functions

```typescript
// tests/edge-functions/ml-sync.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('ML Sync Edge Function', () => {
  const FUNCTION_URL = 'http://localhost:54321/functions/v1/ml-sync'
  
  it('should sync product to ML successfully', async () => {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        productId: 'test-product-id',
        operation: 'create'
      })
    })

    expect(response.status).toBe(200)
    
    const result = await response.json()
    expect(result.success).toBe(true)
    expect(result.mlItemId).toBeDefined()
  })

  it('should handle authentication errors', async () => {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'test' })
    })

    expect(response.status).toBe(401)
  })
})
```

### Database Operations

```typescript
// tests/database/ml-product-mapping.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { supabase } from '@/integrations/supabase/client'

describe('ML Product Mapping Database', () => {
  const testTenantId = 'test-tenant-123'
  const testProductId = 'test-product-456'

  afterEach(async () => {
    // Cleanup test data
    await supabase
      .from('ml_product_mapping')
      .delete()
      .eq('tenant_id', testTenantId)
  })

  it('should create product mapping', async () => {
    const { data, error } = await supabase
      .from('ml_product_mapping')
      .insert({
        tenant_id: testTenantId,
        product_id: testProductId,
        ml_item_id: 'MLB123456',
        sync_status: 'synced'
      })
      .select()

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data[0].ml_item_id).toBe('MLB123456')
  })

  it('should enforce unique product mapping per tenant', async () => {
    // First insert
    await supabase
      .from('ml_product_mapping')
      .insert({
        tenant_id: testTenantId,
        product_id: testProductId,
        ml_item_id: 'MLB123456'
      })

    // Duplicate insert should fail
    const { error } = await supabase
      .from('ml_product_mapping')
      .insert({
        tenant_id: testTenantId,
        product_id: testProductId,
        ml_item_id: 'MLB789012'
      })

    expect(error).toBeDefined()
    expect(error?.code).toBe('23505') // Unique violation
  })
})
```

## Testes E2E

### Cypress Setup

```typescript
// cypress/e2e/ml-integration.cy.ts
describe('Mercado Livre Integration', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password')
    cy.visit('/marketplaces')
  })

  it('should complete OAuth flow', () => {
    cy.get('[data-testid="connect-ml-button"]').click()
    
    // Mock ML OAuth page
    cy.intercept('GET', '**/oauth/authorize**', {
      statusCode: 302,
      headers: {
        location: '/auth/callback?code=test_auth_code'
      }
    })

    cy.url().should('include', '/auth/callback')
    cy.get('[data-testid="ml-connection-status"]').should('contain', 'Conectado')
  })

  it('should sync product to ML', () => {
    // Ensure ML is connected
    cy.connectToML()
    
    cy.visit('/products')
    cy.get('[data-testid="product-item"]:first').within(() => {
      cy.get('[data-testid="sync-to-ml-button"]').click()
    })

    cy.get('[data-testid="sync-status"]').should('contain', 'Sincronizado')
    cy.get('[data-testid="ml-item-link"]').should('be.visible')
  })
})
```

### Custom Commands

```typescript
// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      connectToML(): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/auth')
    cy.get('[data-testid="email-input"]').type(email)
    cy.get('[data-testid="password-input"]').type(password)
    cy.get('[data-testid="login-button"]').click()
    cy.url().should('include', '/dashboard')
  })
})

Cypress.Commands.add('connectToML', () => {
  cy.request('POST', '/api/test/connect-ml', {
    tenantId: Cypress.env('TEST_TENANT_ID')
  })
})
```

## Mocks e Test Doubles

### Supabase Client Mock

```typescript
// tests/mocks/supabase.ts
export const createMockSupabaseClient = () => ({
  from: vi.fn(() => ({
    select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
    update: vi.fn(() => Promise.resolve({ data: [], error: null })),
    delete: vi.fn(() => Promise.resolve({ data: [], error: null })),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis()
  })),
  functions: {
    invoke: vi.fn(() => Promise.resolve({ data: null, error: null }))
  },
  auth: {
    getUser: vi.fn(() => Promise.resolve({ 
      data: { user: { id: 'test-user' } }, 
      error: null 
    }))
  }
})
```

### ML API Mock

```typescript
// tests/mocks/ml-api.ts
export const mockMLAPI = () => {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes('/oauth/token')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'mock_token',
          refresh_token: 'mock_refresh',
          expires_in: 3600
        })
      })
    }
    
    if (url.includes('/items')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: 'MLB123456',
          title: 'Test Product',
          price: 99.90,
          permalink: 'https://produto.mercadolivre.com.br/test'
        })
      })
    }
    
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Not found' })
    })
  })
}
```

## Performance Tests

### Load Testing

```typescript
// tests/performance/ml-sync-load.test.ts
import { describe, it, expect } from 'vitest'

describe('ML Sync Performance', () => {
  it('should handle 100 concurrent product syncs', async () => {
    const startTime = Date.now()
    
    const promises = Array.from({ length: 100 }, (_, i) => 
      syncProductToML(`product-${i}`)
    )
    
    const results = await Promise.allSettled(promises)
    const endTime = Date.now()
    
    const successful = results.filter(r => r.status === 'fulfilled').length
    const avgTime = (endTime - startTime) / 100
    
    expect(successful).toBeGreaterThan(95) // 95% success rate
    expect(avgTime).toBeLessThan(2000) // Under 2s average
  })
})
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linter
        run: npm run lint
        
      - name: Run type check
        run: npm run type-check
        
      - name: Run unit tests
        run: npm run test:coverage
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        
      - name: Run E2E tests
        run: npm run test:e2e
```

## Métricas de Qualidade

### Cobertura de Testes
- **Services**: >95%
- **Hooks**: >90%
- **Utils**: >95%
- **Components**: >80%
- **Edge Functions**: >85%

### Performance Benchmarks
- **Edge Function Response**: <2s average
- **Database Queries**: <500ms
- **E2E Test Suite**: <10 minutes
- **Unit Test Suite**: <30 seconds

### Quality Gates
- All tests must pass
- Coverage thresholds met
- No TypeScript errors
- Linting passes
- Performance benchmarks met