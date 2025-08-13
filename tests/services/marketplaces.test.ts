import { describe, it, expect, beforeEach, vi } from 'vitest';
import { marketplacesService } from '@/services/marketplaces';
import { testUtils } from '../setup';

// Mock do Supabase é feito no setup.ts
describe('MarketplacesService', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
  });

  describe('getHierarchical', () => {
    it('deve montar hierarquia corretamente', async () => {
      const platform1 = testUtils.createMockMarketplace({
        id: 'p1',
        name: 'Platform 1',
        marketplace_type: 'platform'
      });
      const modality1 = testUtils.createMockMarketplace({
        id: 'm1',
        name: 'Modality 1',
        marketplace_type: 'modality',
        platform_id: 'p1'
      });
      const modality2 = testUtils.createMockMarketplace({
        id: 'm2',
        name: 'Modality 2',
        marketplace_type: 'modality',
        platform_id: 'p1'
      });
      const platform2 = testUtils.createMockMarketplace({
        id: 'p2',
        name: 'Platform 2',
        marketplace_type: 'platform'
      });
      const orphan = testUtils.createMockMarketplace({
        id: 'm3',
        name: 'Orphan Modality',
        marketplace_type: 'modality',
        platform_id: null
      });

      const mockData = [platform1, modality1, modality2, platform2, orphan];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null })
      };
      testUtils.mockSupabaseClient.from.mockReturnValue(
        mockQuery as unknown as import('../types/postgrest').PostgrestQueryMock
      );

      const result = await marketplacesService.getHierarchical();

      expect(testUtils.mockSupabaseClient.from).toHaveBeenCalledWith('marketplaces');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.order).toHaveBeenCalledWith('name');
      expect(result).toEqual([
        { parent: platform1, children: [modality1, modality2] },
        { parent: platform2, children: [] },
        { parent: orphan, children: [] }
      ]);
    });
  });

  describe('getModalitiesByPlatform', () => {
    it('deve filtrar modalidades pela categoria', async () => {
      const modality1 = testUtils.createMockMarketplace({
        id: 'm1',
        name: 'Mod1',
        marketplace_type: 'modality',
        platform_id: 'p1',
        category_restrictions: ['cat1', 'cat2']
      });
      const modality2 = testUtils.createMockMarketplace({
        id: 'm2',
        name: 'Mod2',
        marketplace_type: 'modality',
        platform_id: 'p1',
        category_restrictions: ['cat3']
      });
      const modality3 = testUtils.createMockMarketplace({
        id: 'm3',
        name: 'Mod3',
        marketplace_type: 'modality',
        platform_id: 'p1',
        category_restrictions: []
      });

      const mockData = [modality1, modality2, modality3];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null })
      };
      testUtils.mockSupabaseClient.from.mockReturnValue(
        mockQuery as unknown as import('../types/postgrest').PostgrestQueryMock
      );

      const result = await marketplacesService.getModalitiesByPlatform('p1', 'cat1');

      expect(testUtils.mockSupabaseClient.from).toHaveBeenCalledWith('marketplaces');
      expect(mockQuery.eq).toHaveBeenNthCalledWith(1, 'platform_id', 'p1');
      expect(mockQuery.eq).toHaveBeenNthCalledWith(2, 'marketplace_type', 'modality');
      expect(result).toEqual([modality1, modality3]);
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

      const result = await marketplacesService.validateName('Nome Único');

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

      const result = await marketplacesService.validateName('Nome Existente');

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

      const result = await marketplacesService.validateName('Nome', 'test-id');

      expect(mockQuery.eq).toHaveBeenCalledWith('name', 'Nome');
      expect(mockQueryAfterEq.neq).toHaveBeenCalledWith('id', 'test-id');
      expect(result).toBe(true);
    });
  });
});

