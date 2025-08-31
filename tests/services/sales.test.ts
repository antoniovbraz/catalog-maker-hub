import { describe, it, expect, beforeEach, vi } from 'vitest';
import { salesService } from '@/services/sales';
import { testUtils } from '../setup';

// Mock do Supabase é feito no setup.ts

describe('SalesService', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
  });

  it('deve buscar vendas com detalhes', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [{ id: 's1' }], error: null })
    };
    testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery as any);

    const result = await salesService.getAllWithDetails();

    expect(testUtils.mockSupabaseClient.from).toHaveBeenCalledWith('sales');
    expect(result).toEqual([{ id: 's1' }]);
  });
});
