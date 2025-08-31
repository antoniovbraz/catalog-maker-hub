import { describe, it, expect, beforeEach, vi } from 'vitest';
import { assistantsService } from '@/services/assistants';
import { testUtils } from '../setup';

// Mock do Supabase é feito no setup.ts

describe('AssistantsService', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
  });

  it('deve retornar assistente por marketplace', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'a1' }, error: null })
    };
    testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery as any);

    const result = await assistantsService.getAssistantByMarketplace('ml');

    expect(testUtils.mockSupabaseClient.from).toHaveBeenCalledWith('assistants');
    expect(result).toEqual({ id: 'a1' });
  });

  it('deve retornar null quando não encontrar assistente', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    };
    testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery as any);

    const result = await assistantsService.getAssistantByMarketplace('ml');

    expect(result).toBeNull();
  });
});
