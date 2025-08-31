import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adsService } from '@/services/ads';
import { testUtils } from '../setup';

// Mock do Supabase é feito no setup.ts

describe('AdsService', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
  });

  it('deve retornar imagens do produto', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [{ id: 'img1' }], error: null })
    };
    testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery as any);

    const result = await adsService.getProductImages('prod1');

    expect(testUtils.mockSupabaseClient.from).toHaveBeenCalledWith('product_images');
    expect(result).toEqual([{ id: 'img1' }]);
  });

  it('deve contar imagens do produto', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 2, error: null })
    };
    testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery as any);

    const count = await adsService.getProductImagesCount('prod1');

    expect(testUtils.mockSupabaseClient.from).toHaveBeenCalledWith('product_images');
    expect(count).toBe(2);
  });

  it('deve reordenar imagens', async () => {
    const updateSpy = vi.spyOn(adsService, 'update').mockResolvedValue({} as any);

    await adsService.reorderImages('prod1', [{ id: '1', sort_order: 2 }]);

    expect(updateSpy).toHaveBeenCalledWith('1', { sort_order: 2 });
  });
});
