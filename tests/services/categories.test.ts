import { describe, it, expect, beforeEach, vi } from 'vitest';
import { categoriesService } from '@/services/categories';
import { testUtils } from '../setup';

// Helper para criar mock completo da query do Supabase
const createQueryMock = (overrides: Record<string, any> = {}) => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  ...overrides,
});

// Mock do Supabase é feito no setup.ts
describe('CategoriesService', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
  });

  describe('getWithProductCount', () => {
    it('deve mapear product_count corretamente', async () => {
      const mockCategories = [
        {
          ...testUtils.createMockCategory({ id: '1', name: 'Categoria 1' }),
          products: [{ count: 3 }]
        },
        {
          ...testUtils.createMockCategory({ id: '2', name: 'Categoria 2' }),
          products: []
        }
      ];

      const mockQuery = createQueryMock({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockCategories, error: null })
      });
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await categoriesService.getWithProductCount();

      expect(testUtils.mockSupabaseClient.from).toHaveBeenCalledWith('categories');
      expect(mockQuery.select).toHaveBeenCalledWith(`
        *,
        products:products(count)
      `);
      expect(result).toEqual([
        { ...mockCategories[0], product_count: 3 },
        { ...mockCategories[1], product_count: 0 }
      ]);
    });
  });

  describe('validateName', () => {
    it('deve retornar true quando nome é único', async () => {
      const mockQuery = createQueryMock({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null })
      });
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await categoriesService.validateName('Nome Único');

      expect(result).toBe(true);
      expect(mockQuery.eq).toHaveBeenCalledWith('name', 'Nome Único');
    });

    it('deve retornar false quando nome já existe', async () => {
      const mockQuery = createQueryMock({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [{ id: 'existing-id' }], error: null })
      });
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await categoriesService.validateName('Nome Existente');

      expect(result).toBe(false);
    });

    it('deve excluir ID específico na validação', async () => {
      const mockQueryAfterEq = createQueryMock({
        neq: vi.fn().mockResolvedValue({ data: [], error: null })
      });
      const mockQuery = createQueryMock({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(mockQueryAfterEq)
      });
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await categoriesService.validateName('Nome', 'test-id');

      expect(mockQuery.eq).toHaveBeenCalledWith('name', 'Nome');
      expect(mockQueryAfterEq.neq).toHaveBeenCalledWith('id', 'test-id');
      expect(result).toBe(true);
    });
  });
});

