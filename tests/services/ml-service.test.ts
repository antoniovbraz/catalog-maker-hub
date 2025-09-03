import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/utils/ml/ml-api', async () => {
  const actual = await vi.importActual<typeof import('@/utils/ml/ml-api')>('@/utils/ml/ml-api');
  return {
    ...actual,
    callMLFunction: vi.fn(),
  };
});

import { callMLFunction } from '@/utils/ml/ml-api';
import { MLService, MLPerformanceMetrics } from '@/services/ml-service';
import { testUtils } from '../setup';

// Mock do Supabase é feito no setup.ts

describe('MLService', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
    vi.mocked(callMLFunction).mockReset();
    testUtils.mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: null });
  });

  describe('Auth Status', () => {
    it('deve obter status de auth quando conectado', async () => {
      vi.mocked(callMLFunction).mockResolvedValue({
        connected: true,
        user_id_ml: 123,
        ml_nickname: 'test'
      });

      const status = await MLService.getAuthStatus();

      expect(status.isConnected).toBe(true);
      expect(status.user_id_ml).toBe(123);
      expect(status.ml_nickname).toBe('test');
      expect(callMLFunction).toHaveBeenCalledWith('ml-auth', 'get_status', {}, {});
    });

    it('deve retornar desconectado quando há erro', async () => {
      vi.mocked(callMLFunction).mockRejectedValue(new Error('Token expired'));

      const status = await MLService.getAuthStatus();

      expect(status.isConnected).toBe(false);
      expect(status.error).toBe('Token expired');
    });

    it('deve tratar exceções de rede', async () => {
      vi.mocked(callMLFunction).mockRejectedValue(new Error('Network error'));

      const status = await MLService.getAuthStatus();

      expect(status.isConnected).toBe(false);
      expect(status.error).toBe('Network error while checking auth status');
    });
  });

  describe('Sync Operations', () => {
    it('deve sincronizar produto individual', async () => {
      vi.mocked(callMLFunction).mockResolvedValue({ success: true });

      await MLService.syncProduct('product-123');

      expect(callMLFunction).toHaveBeenCalledWith('ml-sync-v2', 'sync_product', { product_id: 'product-123' }, {});
    });

    it('deve sincronizar em lote', async () => {
      vi.mocked(callMLFunction).mockResolvedValue({ successful: 3, failed: 1 });

      const result = await MLService.syncBatch(['p1', 'p2', 'p3', 'p4']);

      expect(result.successful).toBe(3);
      expect(result.failed).toBe(1);
      expect(callMLFunction).toHaveBeenCalledWith('ml-sync-v2', 'sync_batch', { product_ids: ['p1', 'p2', 'p3', 'p4'] }, {});
    });

    it('deve re-sincronizar produto', async () => {
      vi.mocked(callMLFunction).mockResolvedValue(null);

      await MLService.resyncProduct('product-123');

      expect(callMLFunction).toHaveBeenCalledWith('ml-sync-v2', 'resync_product', { productId: 'product-123' }, {});
    });

    it('deve importar do ML', async () => {
      vi.mocked(callMLFunction).mockResolvedValue({ created: 5, updated: 2 });

      const result = await MLService.importFromML();

      expect(result.created).toBe(5);
      expect(result.updated).toBe(2);
      expect(callMLFunction).toHaveBeenCalledWith('ml-sync-v2', 'import_from_ml', {}, {});
    });
  });

  describe('Utility Functions', () => {
    it('deve formatar erros de auth corretamente', () => {
      expect(MLService.formatAuthError('invalid_grant')).toContain('inválido');
      expect(MLService.formatAuthError('access_denied')).toContain('negado');
      expect(MLService.formatAuthError('unknown_error')).toContain('desconhecido');
    });

    it('deve formatar status de sync', () => {
      expect(MLService.formatSyncStatus('pending').label).toBe('Pendente');
      expect(MLService.formatSyncStatus('synced').label).toBe('Sincronizado');
      expect(MLService.formatSyncStatus('error').color).toBe('red');
    });

    it('deve verificar se token está expirando', () => {
      const expiringSoon = new Date(Date.now() + 1000).toISOString(); // 1 segundo
      const expiringLater = new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(); // 10 horas
      
      expect(MLService.isTokenExpiringSoon(expiringSoon, 1)).toBe(true);
      expect(MLService.isTokenExpiringSoon(expiringLater, 1)).toBe(false);
    });
  });

  describe('Health Score Calculation', () => {
    it('deve calcular health score corretamente', () => {
      const metrics: MLPerformanceMetrics = {
        total_operations: 100,
        successful_operations: 80,
        failed_operations: 20,
        average_response_time: 6000,
        success_rate: 80,
        operations_by_type: { sync: 50, import: 30, create: 20 }
      };

      const result = MLService.calculateHealthScore(metrics);
      
      expect(result.score).toBeLessThan(100); // Should be penalized for low success rate and high response time
      expect(result.level).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('deve dar score excellent para métricas perfeitas', () => {
      const perfectMetrics: MLPerformanceMetrics = {
        total_operations: 100,
        successful_operations: 100,
        failed_operations: 0,
        average_response_time: 1000,
        success_rate: 100,
        operations_by_type: { sync: 100 }
      };

      const result = MLService.calculateHealthScore(perfectMetrics);
      
      expect(result.score).toBe(100);
      expect(result.level).toBe('excellent');
      expect(result.recommendations.length).toBe(0);
    });
  });

  describe('Advanced Settings', () => {
    it('deve obter configurações avançadas', async () => {
      const mockSettings = {
        id: 'test-id',
        tenant_id: 'tenant-123',
        feature_flags: { auto_sync: true },
        rate_limits: { default: 30 },
        auto_recovery_enabled: true,
        advanced_monitoring: false,
        multi_account_enabled: false,
        backup_schedule: 'daily',
        security_level: 'standard',
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      };

      testUtils.mockSupabaseClient.rpc.mockResolvedValue({ data: mockSettings, error: null });

      const result = await MLService.getAdvancedSettings();

      expect(result).toEqual(mockSettings);
      expect(testUtils.mockSupabaseClient.rpc).toHaveBeenCalledWith('get_ml_advanced_settings');
    });

    it('deve atualizar configurações avançadas', async () => {
      const updatedSettings = { auto_recovery_enabled: false };
      testUtils.mockSupabaseClient.rpc.mockResolvedValue({ data: updatedSettings, error: null });

      const result = await MLService.updateAdvancedSettings(updatedSettings);

      expect(result).toEqual(updatedSettings);
      expect(testUtils.mockSupabaseClient.rpc).toHaveBeenCalledWith('update_ml_advanced_settings', {
        p_settings: updatedSettings
      });
    });
  });

  describe('Performance Metrics', () => {
    it('deve obter métricas de performance', async () => {
      const mockMetrics = {
        total_operations: 100,
        successful_operations: 95,
        failed_operations: 5,
        average_response_time: 2000,
        success_rate: 95,
        operations_by_type: { sync: 80, import: 20 }
      };

      testUtils.mockSupabaseClient.rpc.mockResolvedValue({ data: mockMetrics, error: null });

      const result = await MLService.getPerformanceMetrics(7);

      expect(result).toEqual(mockMetrics);
      expect(testUtils.mockSupabaseClient.rpc).toHaveBeenCalledWith('get_ml_performance_metrics', {
        p_days: 7
      });
    });
  });

  describe('Error Handling', () => {
    it('deve tratar erros de RPC adequadamente', async () => {
      testUtils.mockSupabaseClient.rpc.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' }
      });

      await expect(MLService.getAdvancedSettings()).rejects.toThrow('Database error');
    });

    it('deve tratar erros de function invoke adequadamente', async () => {
      vi.mocked(callMLFunction).mockRejectedValue(new Error('Function error'));

      await expect(MLService.syncProduct('test')).rejects.toThrow('Function error');
    });

    it('deve propagar detalhes de erro das edge functions', async () => {
      const actual = await vi.importActual<typeof import('@/utils/ml/ml-api')>('@/utils/ml/ml-api');
      vi.mocked(callMLFunction).mockImplementation(actual.callMLFunction);

      testUtils.mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session: null } });
      testUtils.mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Outer', details: { message: 'Detalhe da edge' } }
      });

      await expect(MLService.syncProduct('test')).rejects.toThrow('Detalhe da edge');
    });
  });
});