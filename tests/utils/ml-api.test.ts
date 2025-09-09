import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { callMLFunction, processInBatches, clearCallHistory, getRateLimitStats } from '@/utils/ml/ml-api';
import { testUtils } from '../setup';

describe('ML API Utils', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
    clearCallHistory();
    vi.clearAllTimers();
    vi.useFakeTimers();
    testUtils.mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
      error: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('callMLFunction', () => {
    it('deve fazer chamada básica com sucesso', async () => {
      testUtils.mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null
      });

      const result = await callMLFunction('ml-sync-v2', 'sync_product', { productId: '123' });

      expect(result).toEqual({ success: true });
      expect(testUtils.mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('ml-sync-v2', {
        body: { action: 'sync_product', productId: '123' },
        headers: { Authorization: 'Bearer test-token' },
        signal: expect.any(AbortSignal)
      });
    });

    it('deve respeitar rate limiting', async () => {
      testUtils.mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null
      });

      // Fazer 60 chamadas (limite para sync_product)
      for (let i = 0; i < 60; i++) {
        await callMLFunction('ml-sync-v2', 'sync_product', { productId: `${i}` });
      }

      // A 61ª chamada deve falhar por rate limit
      await expect(callMLFunction('ml-sync-v2', 'sync_product', { productId: '61' })).rejects.toThrow('Rate limit excedido');
    });

    it('deve pular rate limiting quando especificado', async () => {
      testUtils.mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null
      });

      // Fazer 60 chamadas para esgotar rate limit
      for (let i = 0; i < 60; i++) {
        await callMLFunction('ml-sync-v2', 'sync_product', { productId: `${i}` });
      }

      // Esta deve passar por usar skipRateCheck
      const result = await callMLFunction('ml-sync-v2', 'sync_product', { productId: '61' }, { skipRateCheck: true });
      expect(result).toEqual({ success: true });
    });

    it('não deve compartilhar rate limit entre funções', async () => {
      testUtils.mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null
      });

      for (let i = 0; i < 30; i++) {
        await callMLFunction('ml-sync-v2', 'get_status', {});
      }

      await expect(callMLFunction('ml-auth', 'get_status', {})).resolves.toEqual({ success: true });
    });

    it('deve tratar timeout corretamente', async () => {
      let abortSignal: AbortSignal | undefined;
      testUtils.mockSupabaseClient.functions.invoke.mockImplementation((_, { signal }) => {
        abortSignal = signal;
        return new Promise((resolve, reject) => {
          const id = setTimeout(() => resolve({ data: null, error: null }), 2000);
          signal?.addEventListener('abort', () => {
            clearTimeout(id);
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
          });
        });
      });

      const promise = callMLFunction('ml-sync-v2', 'sync_product', { productId: '123' }, { timeout: 1000 });
      const handled = promise.catch(err => err);
      await vi.advanceTimersByTimeAsync(1000);
      const error = await handled;
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Operação sync_product demorou muito para responder');
      expect(abortSignal?.aborted).toBe(true);
    });

    it('deve tratar erros do Supabase', async () => {
      testUtils.mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(callMLFunction('ml-sync-v2', 'sync_product', { productId: '123' })).rejects.toThrow('Database error');
    });

    it('deve melhorar mensagens de erro conhecidas', async () => {
      testUtils.mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'unauthorized token' }
      });

      await expect(callMLFunction('ml-sync-v2', 'sync_product', { productId: '123' })).rejects.toThrow('Token do Mercado Livre expirado ou inválido');
    });

    it('deve extrair erro do contexto quando FunctionsHttpError é retornado', async () => {
      const context = {
        text: vi.fn().mockResolvedValue(JSON.stringify({ error: 'Missing required fields' }))
      };

      testUtils.mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: null,
        error: { name: 'FunctionsHttpError', context }
      });

      await expect(
        callMLFunction('ml-sync-v2', 'sync_product', { productId: '123' })
      ).rejects.toThrow('Missing required fields');
      expect(context.text).toHaveBeenCalled();
    });
  });

  describe('processInBatches', () => {
    it('deve processar itens em lotes', async () => {
      const processor = vi.fn().mockResolvedValue('success');
      const items = ['1', '2', '3', '4', '5'];

      const promise = processInBatches(items, processor, 'test_operation', 2, 0);
      await vi.runAllTimersAsync();
      const results = await promise;

      expect(results).toHaveLength(5);
      expect(results.every(r => r.status === 'fulfilled')).toBe(true);
      expect(processor).toHaveBeenCalledTimes(5);
    });

    it('deve aguardar entre lotes', async () => {
      const processor = vi.fn().mockResolvedValue('success');
      const items = ['1', '2', '3', '4'];
      const delay = 1000;

      const promise = processInBatches(items, processor, 'test_operation', 2, delay);

      // Avançar o tempo para processar o primeiro lote
      await vi.advanceTimersByTimeAsync(0);
      expect(processor).toHaveBeenCalledTimes(2);

      // Avançar o delay entre lotes
      await vi.advanceTimersByTimeAsync(delay);
      
      // Aguardar o processamento do segundo lote
      await vi.advanceTimersByTimeAsync(0);
      
      const results = await promise;
      expect(results).toHaveLength(4);
      expect(processor).toHaveBeenCalledTimes(4);
    });

    it('deve tratar erros individuais', async () => {
      const processor = vi.fn()
        .mockResolvedValueOnce('success')
        .mockRejectedValueOnce(new Error('item error'))
        .mockResolvedValueOnce('success');
      
      const items = ['1', '2', '3'];

      const results = await processInBatches(items, processor, 'test_operation', 3, 0);

      expect(results).toHaveLength(3);
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });
  });

  describe('Rate Limit Stats', () => {
    it('deve retornar estatísticas vazias inicialmente', () => {
      const stats = getRateLimitStats();
      expect(stats).toEqual({});
    });

    it('deve rastrear estatísticas de chamadas', async () => {
      testUtils.mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null
      });

      await callMLFunction('ml-sync-v2', 'sync_product', { productId: '1' });
      await callMLFunction('ml-sync-v2', 'sync_product', { productId: '2' });

      const stats = getRateLimitStats();
      const key = 'ml-sync-v2:sync_product';
      expect(stats[key]).toBeDefined();
      expect(stats[key].calls).toBe(2);
      expect(stats[key].limit).toBe(60);
    });

    it('deve limpar estatísticas antigas da janela', async () => {
      testUtils.mockSupabaseClient.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null
      });

      await callMLFunction('ml-sync-v2', 'sync_product', { productId: '1' });

      // Avançar tempo além da janela (60 segundos)
      vi.advanceTimersByTime(65 * 1000);

      const stats = getRateLimitStats();
      expect(stats['ml-sync-v2:sync_product'].calls).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('deve registrar chamadas mesmo com erro', async () => {
      testUtils.mockSupabaseClient.functions.invoke.mockRejectedValue(new Error('Network error'));

      try {
        await callMLFunction('ml-sync-v2', 'sync_product', { productId: '1' });
      } catch (error) {
        // Expected error
      }

      const stats = getRateLimitStats();
      expect(stats['ml-sync-v2:sync_product'].calls).toBe(1);
    });

    it('deve melhorar mensagens de erro de timeout', async () => {
      testUtils.mockSupabaseClient.functions.invoke.mockImplementation((_, { signal }) =>
        new Promise((_, reject) => {
          signal?.addEventListener('abort', () => {
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
          });
        })
      );

      const promise = callMLFunction('ml-sync-v2', 'sync_product', { productId: '123' }, { timeout: 100 });
      const handled = promise.catch(err => err);
      await vi.advanceTimersByTimeAsync(100);
      const error = await handled;
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Operação sync_product demorou muito para responder');
    });
  });
});