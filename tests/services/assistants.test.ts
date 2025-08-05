import { describe, it, expect, beforeEach, vi } from 'vitest';
import { assistantsService } from '@/services/assistants';
import { testUtils } from '../setup';

// Helper to create a complete mock of the Supabase query
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
  maybeSingle: vi.fn().mockReturnThis(),
  ...overrides,
});

describe('AssistantsService', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
  });

  describe('getAssistantByMarketplace', () => {
    it('deve buscar assistente no modo rápido apenas com marketplace', async () => {
      const mockAssistant = {
        id: '1',
        name: 'Quick Assistant',
        marketplace: 'mercado_livre',
        mode: 'quick'
      };

      const mockQuery = createQueryMock({
        maybeSingle: vi.fn().mockResolvedValue({ data: mockAssistant, error: null })
      });
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await assistantsService.getAssistantByMarketplace('mercado_livre');

      expect(testUtils.mockSupabaseClient.from).toHaveBeenCalledWith('assistants');
      expect(mockQuery.eq).toHaveBeenNthCalledWith(1, 'marketplace', 'mercado_livre');
      expect(mockQuery.eq).toHaveBeenNthCalledWith(2, 'mode', 'quick');
      expect(result).toEqual(mockAssistant);
    });

    it('deve buscar assistente estratégico usando marketplace e productId', async () => {
      const mockAssistant = {
        id: '2',
        name: 'Strategic Assistant',
        marketplace: 'mercado_livre',
        mode: 'strategic',
        product_id: 'prod-1'
      };

      const mockQuery = createQueryMock({
        maybeSingle: vi.fn().mockResolvedValue({ data: mockAssistant, error: null })
      });
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await assistantsService.getAssistantByMarketplace('mercado_livre', 'strategic', 'prod-1');

      expect(testUtils.mockSupabaseClient.from).toHaveBeenCalledWith('assistants');
      expect(mockQuery.eq).toHaveBeenNthCalledWith(1, 'marketplace', 'mercado_livre');
      expect(mockQuery.eq).toHaveBeenNthCalledWith(2, 'mode', 'strategic');
      expect(mockQuery.eq).toHaveBeenNthCalledWith(3, 'product_id', 'prod-1');
      expect(result).toEqual(mockAssistant);
    });

    it('deve lançar erro se modo estratégico for chamado sem productId', async () => {
      await expect(
        assistantsService.getAssistantByMarketplace('mercado_livre', 'strategic')
      ).rejects.toThrow('productId');
    });
  });
});

