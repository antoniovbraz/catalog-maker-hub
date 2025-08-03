import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// Limpa após cada teste
afterEach(() => {
  cleanup();
});

// Mock do Supabase Client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  })),
  rpc: vi.fn(),
  auth: {
    getUser: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  },
  storage: {
    from: vi.fn(),
  },
};

// Mock das funções de toast
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};

// Mock do React Query
const mockQueryClient = {
  invalidateQueries: vi.fn(),
  setQueryData: vi.fn(),
  getQueryData: vi.fn(),
};

// Disponibiliza mocks globalmente
beforeAll(() => {
  // Mock do Supabase
  vi.doMock('@/integrations/supabase/client', () => ({
    supabase: mockSupabaseClient,
  }));

  // Mock do toast
  vi.doMock('@/components/ui/use-toast', () => ({
    toast: mockToast,
    useToast: () => ({ toast: mockToast }),
  }));

  // Mock do React Router
  vi.doMock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
      ...actual,
      useNavigate: () => vi.fn(),
      useParams: () => ({}),
      useLocation: () => ({ pathname: '/' }),
    };
  });

  // Mock do window.matchMedia para componentes responsivos
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Utilitários para testes
export const testUtils = {
  mockSupabaseClient,
  mockToast,
  mockQueryClient,
  
  // Cria dados mock para testes
  createMockProduct: (overrides = {}) => ({
    id: 'test-product-id',
    name: 'Produto Teste',
    sku: 'TEST-001',
    description: 'Descrição do produto teste',
    category_id: 'test-category-id',
    cost_unit: 100,
    packaging_cost: 10,
    tax_rate: 18,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  createMockCategory: (overrides = {}) => ({
    id: 'test-category-id',
    name: 'Categoria Teste',
    description: 'Descrição da categoria teste',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  createMockMarketplace: (overrides = {}) => ({
    id: 'test-marketplace-id',
    name: 'Marketplace Teste',
    description: 'Descrição do marketplace teste',
    url: 'https://example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  createMockSale: (overrides = {}) => ({
    id: 'test-sale-id',
    product_id: 'test-product-id',
    marketplace_id: 'test-marketplace-id',
    price_charged: 150,
    quantity: 1,
    sold_at: new Date().toISOString(),
    ...overrides,
  }),

  // Reseta todos os mocks
  resetAllMocks: () => {
    vi.clearAllMocks();
    mockSupabaseClient.from.mockClear();
    mockSupabaseClient.rpc.mockClear();
    Object.values(mockToast).forEach(fn => fn.mockClear());
    Object.values(mockQueryClient).forEach(fn => fn.mockClear());
  },
};