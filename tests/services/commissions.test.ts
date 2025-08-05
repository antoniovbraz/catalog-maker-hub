import { describe, it, expect, beforeEach, vi } from 'vitest';
import { commissionsService } from '@/services/commissions';
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

describe('CommissionsService', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
  });

  describe('findApplicableCommission', () => {
    it('should find specific commission for category first', async () => {
      const mockSpecificCommission = {
        id: '1',
        marketplace_id: 'marketplace-1',
        category_id: 'category-1',
        rate: 0.15,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      };
      const mockQuery = createQueryMock({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSpecificCommission, error: null })
      });
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await commissionsService.findApplicableCommission({
        marketplaceId: 'marketplace-1',
        categoryId: 'category-1'
      });
      expect(result).toEqual(mockSpecificCommission);
      expect(testUtils.mockSupabaseClient.from).toHaveBeenCalledWith('commissions');
    });

    it('should fallback to default commission when category-specific not found', async () => {
      const mockDefaultCommission = {
        id: '2',
        marketplace_id: 'marketplace-1',
        category_id: null,
        rate: 0.12,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      };

      const firstQuery = createQueryMock({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      });
      const secondQuery = createQueryMock({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockDefaultCommission, error: null })
      });
      testUtils.mockSupabaseClient.from
        .mockReturnValueOnce(firstQuery)
        .mockReturnValueOnce(secondQuery);

      const result = await commissionsService.findApplicableCommission({
        marketplaceId: 'marketplace-1',
        categoryId: 'category-1'
      });

      expect(result).toEqual(mockDefaultCommission);
    });

    it('should return null when no commission found', async () => {
      const firstQuery = createQueryMock({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      });
      const secondQuery = createQueryMock({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      });
      testUtils.mockSupabaseClient.from
        .mockReturnValueOnce(firstQuery)
        .mockReturnValueOnce(secondQuery);

      const result = await commissionsService.findApplicableCommission({
        marketplaceId: 'marketplace-1',
        categoryId: 'category-1'
      });

      expect(result).toBeNull();
    });
  });

  describe('validateUniqueRule', () => {
    it('should return true when no duplicate exists', async () => {
      const mockQuery = createQueryMock();
      mockQuery.select.mockReturnThis();
      mockQuery.eq
        .mockReturnValueOnce(mockQuery)
        .mockResolvedValueOnce({ data: [], error: null });
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await commissionsService.validateUniqueRule(
        'marketplace-1',
        'category-1'
      );

      expect(result).toBe(true);
    });

    it('should return false when duplicate exists', async () => {
      const mockQuery = createQueryMock();
      mockQuery.select.mockReturnThis();
      mockQuery.eq
        .mockReturnValueOnce(mockQuery)
        .mockResolvedValueOnce({ data: [{ id: 'existing-id' }], error: null });
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await commissionsService.validateUniqueRule(
        'marketplace-1',
        'category-1'
      );

      expect(result).toBe(false);
    });

    it('should handle null category correctly', async () => {
      const mockQuery = createQueryMock();
      mockQuery.select.mockReturnThis();
      mockQuery.eq.mockReturnThis();
      mockQuery.is.mockResolvedValue({ data: [], error: null });
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await commissionsService.validateUniqueRule(
        'marketplace-1',
        null
      );

      expect(result).toBe(true);
    });
  });

  describe('calculateCommissionRate', () => {
    it('should return commission rate when found', async () => {
      const mockCommission = {
        id: '1',
        marketplace_id: 'marketplace-1',
        category_id: 'category-1',
        rate: 0.15,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      };

      // Mock the findApplicableCommission method
      vi.spyOn(commissionsService, 'findApplicableCommission')
        .mockResolvedValue(mockCommission);

      const result = await commissionsService.calculateCommissionRate(
        'marketplace-1',
        'category-1'
      );

      expect(result).toBe(0.15);
    });

    it('should return 0 when no commission found', async () => {
      vi.spyOn(commissionsService, 'findApplicableCommission')
        .mockResolvedValue(null);

      const result = await commissionsService.calculateCommissionRate(
        'marketplace-1',
        'category-1'
      );

      expect(result).toBe(0);
    });

    it('should return 0 on error to not break calculations', async () => {
      vi.spyOn(commissionsService, 'findApplicableCommission')
        .mockRejectedValue(new Error('Database error'));

      const result = await commissionsService.calculateCommissionRate(
        'marketplace-1',
        'category-1'
      );

      expect(result).toBe(0);
    });
  });
});