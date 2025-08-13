import { describe, it, expect, beforeEach, vi } from 'vitest';
import { categoriesService } from '@/services/categories';
import { testUtils } from '../setup';

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

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockCategories, error: null })
      };
      // Tipagem explícita para evitar any
      testUtils.mockSupabaseClient.from.mockReturnValue(
        mockQuery as unknown as import('../types/postgrest').PostgrestQueryMock
      );

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
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null })
      };
      testUtils.mockSupabaseClient.from.mockReturnValue(
        mockQuery as unknown as import('../types/postgrest').PostgrestQueryMock
      );

      const result = await categoriesService.validateName('Nome Único');

      expect(result).toBe(true);
      expect(mockQuery.eq).toHaveBeenCalledWith('name', 'Nome Único');
    });

    it('deve retornar false quando nome já existe', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [{ id: 'existing-id' }], error: null })
      };
      testUtils.mockSupabaseClient.from.mockReturnValue(
        mockQuery as unknown as import('../types/postgrest').PostgrestQueryMock
      );

      const result = await categoriesService.validateName('Nome Existente');

      expect(result).toBe(false);
    });

    it('deve excluir ID específico na validação', async () => {
      const mockQueryAfterEq = {
        neq: vi.fn().mockResolvedValue({ data: [], error: null })
      };
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(mockQueryAfterEq)
      };
      testUtils.mockSupabaseClient.from.mockReturnValue(
        mockQuery as unknown as import('../types/postgrest').PostgrestQueryMock
      );

      const result = await categoriesService.validateName('Nome', 'test-id');

      expect(mockQuery.eq).toHaveBeenCalledWith('name', 'Nome');
      expect(mockQueryAfterEq.neq).toHaveBeenCalledWith('id', 'test-id');
      expect(result).toBe(true);
    });
  });
});

