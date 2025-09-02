import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { testUtils } from '../setup';
import { createWrapper } from '../utils/query-wrapper';
import { useProduct } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ profile: { tenant_id: 'test-tenant-id' } })
}));

const { wrapper, queryClient } = createWrapper();

afterEach(() => {
  queryClient.clear();
  queryClient.removeQueries();
});

describe('useProduct', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
    vi.clearAllMocks();
    (supabase.from as Mock).mockReset();
  });

  it('deve buscar produto por ID com sucesso', async () => {
    const mockProduct = testUtils.createMockProduct({ id: '1', name: 'Produto 1' });
    (supabase.from as Mock).mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: mockProduct, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useProduct('1'), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProduct);
  });

  it('deve lidar com erro ao buscar produto por ID', async () => {
    const mockError = new Error('Failed to fetch product');
    (supabase.from as Mock).mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: mockError.message } }),
        }),
      }),
    });

    const { result } = renderHook(() => useProduct('1'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });
});
