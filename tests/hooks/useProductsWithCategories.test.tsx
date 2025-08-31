import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { testUtils } from '../setup';
import { createWrapper } from '../utils/query-wrapper';
import { useProductsWithCategories } from '@/hooks/useProducts';
import { productsService } from '@/services/products';

vi.mock('@/services/products');

const { wrapper, queryClient } = createWrapper();

afterEach(() => {
  queryClient.clear();
  queryClient.removeQueries();
});

describe('useProductsWithCategories', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
    vi.clearAllMocks();
  });

  it('deve buscar produtos com categorias com sucesso', async () => {
    const mockProducts = [
      {
        ...testUtils.createMockProduct({ id: '1', name: 'Produto 1', category_id: 'cat-1' }),
        categories: testUtils.createMockCategory({ id: 'cat-1', name: 'Categoria 1' }),
      },
      {
        ...testUtils.createMockProduct({ id: '2', name: 'Produto 2', category_id: 'cat-2' }),
        categories: testUtils.createMockCategory({ id: 'cat-2', name: 'Categoria 2' }),
      },
    ];

    vi.mocked(productsService.getAllWithCategories).mockResolvedValue(mockProducts);

    const { result } = renderHook(() => useProductsWithCategories(), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProducts);
    expect(productsService.getAllWithCategories).toHaveBeenCalledOnce();
  });

  it('deve lidar com erro ao buscar produtos com categorias', async () => {
    const mockError = new Error('Failed to fetch products with categories');
    vi.mocked(productsService.getAllWithCategories).mockRejectedValue(mockError);

    const { result } = renderHook(() => useProductsWithCategories(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });
});
