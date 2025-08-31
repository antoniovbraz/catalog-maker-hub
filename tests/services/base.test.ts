import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseService } from '@/services/base';
import { testUtils } from '../setup';

class TestService extends BaseService<any> {
  constructor() {
    super('test_table');
  }
}

const service = new TestService();

describe('BaseService', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
  });

  it('deve buscar todos os registros', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null })
    };
    testUtils.mockSupabaseClient.from.mockReturnValue(
      mockQuery as unknown as import('../types/postgrest').PostgrestQueryMock
    );

    const result = await service.getAll();

    expect(testUtils.mockSupabaseClient.from).toHaveBeenCalledWith('test_table');
    expect(mockQuery.select).toHaveBeenCalledWith('*');
    expect(result).toEqual([{ id: '1' }]);
  });

  it('deve lidar com erros via handleError', () => {
    expect(() => service['handleError']({ message: 'erro' } as any, 'teste'))
      .toThrow('teste falhou: erro');
  });
});
