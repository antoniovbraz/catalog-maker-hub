import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MLService, MLPerformanceMetrics } from '@/services/ml-service';
import { testUtils } from '../setup';

// Mock do Supabase é feito no setup.ts

describe('MLService', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
    (testUtils.mockSupabaseClient as any).functions = { invoke: vi.fn() };
    testUtils.mockSupabaseClient.rpc.mockClear();
  });

  it('deve obter status de auth', async () => {
    testUtils.mockSupabaseClient.functions.invoke.mockResolvedValue({ data: { connected: true }, error: null });

    const status = await MLService.getAuthStatus();

    expect(status.isConnected).toBe(true);
    expect(testUtils.mockSupabaseClient.functions.invoke).toHaveBeenCalled();
  });

  it('deve iniciar auth', async () => {
    testUtils.mockSupabaseClient.functions.invoke.mockResolvedValue({ data: { auth_url: 'url', state: 'st' }, error: null });

    const res = await MLService.startAuth();
    expect(res.auth_url).toBe('url');
  });

  it('deve formatar erros', () => {
    expect(MLService.formatAuthError('invalid_grant')).toContain('inválido');
    expect(MLService.formatSyncStatus('pending').label).toBe('Pendente');
    expect(MLService.isTokenExpiringSoon(new Date(Date.now() - 1000).toISOString())).toBe(true);
  });

  it('deve calcular health score', () => {
    const metrics: MLPerformanceMetrics = {
      total_operations: 100,
      successful_operations: 80,
      failed_operations: 20,
      average_response_time: 6000,
      success_rate: 80,
      operations_by_type: {}
    };

    const result = MLService.calculateHealthScore(metrics);
    expect(result.score).toBeLessThan(100);
  });
});
