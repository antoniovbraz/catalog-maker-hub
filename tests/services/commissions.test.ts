import { describe, it, expect, beforeEach, vi } from 'vitest';
import { commissionsService } from '@/services/commissions';
import { supabase } from '@/integrations/supabase/client';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({ data: [], error: null }))
        })),
        is: vi.fn(() => ({
          single: vi.fn()
        })),
        neq: vi.fn(() => ({ data: [], error: null })),
        order: vi.fn(() => ({ data: [], error: null }))
      })),
      insert: vi.fn(() => ({ data: [], error: null })),
      update: vi.fn(() => ({ data: [], error: null })),
      delete: vi.fn(() => ({ data: [], error: null }))
    }))
  }
}));

describe('CommissionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockSpecificCommission, error: null })
          }))
        }))
      }));

      const mockFrom = vi.fn(() => ({
        select: mockSelect
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      const result = await commissionsService.findApplicableCommission({
        marketplaceId: 'marketplace-1',
        categoryId: 'category-1'
      });

      expect(result).toEqual(mockSpecificCommission);
      expect(mockFrom).toHaveBeenCalledWith('commissions');
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

      let callCount = 0;
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                // Primeira chamada (categoria específica) retorna erro
                return Promise.resolve({ data: null, error: { message: 'Not found' } });
              }
              return Promise.resolve({ data: null, error: { message: 'Not found' } });
            })
          })),
          is: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockDefaultCommission, error: null })
          }))
        }))
      }));

      const mockFrom = vi.fn(() => ({
        select: mockSelect
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      const result = await commissionsService.findApplicableCommission({
        marketplaceId: 'marketplace-1',
        categoryId: 'category-1'
      });

      expect(result).toEqual(mockDefaultCommission);
    });

    it('should return null when no commission found', async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
          })),
          is: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
          }))
        }))
      }));

      const mockFrom = vi.fn(() => ({
        select: mockSelect
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      const result = await commissionsService.findApplicableCommission({
        marketplaceId: 'marketplace-1',
        categoryId: 'category-1'
      });

      expect(result).toBeNull();
    });
  });

  describe('validateUniqueRule', () => {
    it('should return true when no duplicate exists', async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({ data: [], error: null }))
        }))
      }));

      const mockFrom = vi.fn(() => ({
        select: mockSelect
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      const result = await commissionsService.validateUniqueRule(
        'marketplace-1',
        'category-1'
      );

      expect(result).toBe(true);
    });

    it('should return false when duplicate exists', async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({ data: [{ id: 'existing-id' }], error: null }))
        }))
      }));

      const mockFrom = vi.fn(() => ({
        select: mockSelect
      }));

      (supabase.from as any).mockImplementation(mockFrom);

      const result = await commissionsService.validateUniqueRule(
        'marketplace-1',
        'category-1'
      );

      expect(result).toBe(false);
    });

    it('should handle null category correctly', async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          is: vi.fn(() => ({ data: [], error: null }))
        }))
      }));

      const mockFrom = vi.fn(() => ({
        select: mockSelect
      }));

      (supabase.from as any).mockImplementation(mockFrom);

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