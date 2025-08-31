import { describe, it, expect, beforeEach, vi } from 'vitest';
import { subscriptionService } from '@/services/subscription';
import { testUtils } from '../setup';

// Mock do Supabase é feito no setup.ts

describe('SubscriptionService', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
  });

  it('deve buscar planos ativos', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [{ id: 'plan1', is_active: true }], error: null })
    };
    testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery as any);

    const result = await subscriptionService.getAllPlans();

    expect(testUtils.mockSupabaseClient.from).toHaveBeenCalledWith('subscription_plans');
    expect(result[0].id).toBe('plan1');
  });

  it('deve verificar limite de uso', async () => {
    testUtils.mockSupabaseClient.rpc.mockResolvedValue({ data: true, error: null });
    const allowed = await subscriptionService.checkUsageLimit('u1', 'ads', 1);
    expect(allowed).toBe(true);
  });
});
