import { describe, it, expect, beforeEach, vi } from 'vitest';
import { pricingService } from '@/services/pricing';
import { testUtils } from '../setup';

// Mock do Supabase é feito no setup.ts

describe('PricingService', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
  });

  it('deve calcular preço', async () => {
    testUtils.mockSupabaseClient.rpc.mockResolvedValue({ data: { preco_sugerido: 100 }, error: null });

    const result = await pricingService.calcularPreco('p1', 'm1', 1, 2, 3);

    expect(testUtils.mockSupabaseClient.rpc).toHaveBeenCalledWith('calcular_preco', expect.any(Object));
    expect(result).toHaveProperty('preco_sugerido');
  });
});
