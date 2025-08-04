import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { testUtils } from '../setup';
import { useProduct } from '@/hooks/useProducts';
import { productsService } from '@/services/products';

vi.mock('@/services/products');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useProduct', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
    vi.clearAllMocks();
  });

  it('deve buscar produto por ID com sucesso', async () => {
    const mockProduct = testUtils.createMockProduct({ id: '1', name: 'Produto 1' });
    vi.mocked(productsService.getById).mockResolvedValue(mockProduct);

    const { result } = renderHook(() => useProduct('1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProduct);
    expect(productsService.getById).toHaveBeenCalledWith('1');
  });

  it('deve lidar com erro ao buscar produto por ID', async () => {
    const mockError = new Error('Failed to fetch product');
    vi.mocked(productsService.getById).mockRejectedValue(mockError);

    const { result } = renderHook(() => useProduct('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });
});
