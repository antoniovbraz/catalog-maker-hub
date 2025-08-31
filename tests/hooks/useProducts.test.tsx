import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { testUtils } from '../setup';
import { toast } from '../mocks/toast';
import { createWrapper } from '../utils/query-wrapper';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { productsService } from '@/services/products';

// Mock do service
vi.mock('@/services/products');

const { wrapper, queryClient } = createWrapper();

afterEach(() => {
  queryClient.clear();
  queryClient.removeQueries();
});

describe('useProducts hooks', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
    vi.clearAllMocks();
  });

  describe('useProducts', () => {
    it('deve buscar produtos com sucesso', async () => {
      const mockProducts = [
        testUtils.createMockProduct({ id: '1', name: 'Produto 1' }),
        testUtils.createMockProduct({ id: '2', name: 'Produto 2' }),
      ];

      vi.mocked(productsService.getAll).mockResolvedValue(mockProducts);

      const { result } = renderHook(() => useProducts(), {
        wrapper,
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockProducts);
      expect(productsService.getAll).toHaveBeenCalledOnce();
    });

    it('deve lidar com erro ao buscar produtos', async () => {
      const mockError = new Error('Failed to fetch products');
      vi.mocked(productsService.getAll).mockRejectedValue(mockError);

      const { result } = renderHook(() => useProducts(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useCreateProduct', () => {
    it('deve criar produto com sucesso', async () => {
      const newProduct = testUtils.createMockProduct();
      const productData = {
        name: 'Novo Produto',
        cost_unit: 100,
        packaging_cost: 10,
        tax_rate: 18,
      };

      vi.mocked(productsService.create).mockResolvedValue(newProduct);

      const { result } = renderHook(() => useCreateProduct(), {
        wrapper,
      });

      await result.current.mutateAsync(productData);
      expect(productsService.create).toHaveBeenCalledWith(productData);
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Sucesso',
          description: 'Produto criado com sucesso!',
        })
      );
    });

    it('deve lidar com erro ao criar produto', async () => {
      const mockError = new Error('Failed to create product');
      const productData = {
        name: 'Produto com erro',
        cost_unit: 100,
        packaging_cost: 10,
        tax_rate: 18,
      };

      vi.mocked(productsService.create).mockRejectedValue(mockError);

      const { result } = renderHook(() => useCreateProduct(), {
        wrapper,
      });

      await expect(result.current.mutateAsync(productData)).rejects.toThrow(mockError);
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Erro',
          description: mockError.message,
          variant: 'destructive',
        })
      );
    });
  });

  describe('useUpdateProduct', () => {
    it('deve atualizar produto com sucesso', async () => {
      const updatedProduct = testUtils.createMockProduct({ name: 'Produto Atualizado' });
      const updateData = { name: 'Produto Atualizado' };

      vi.mocked(productsService.update).mockResolvedValue(updatedProduct);

      const { result } = renderHook(() => useUpdateProduct(), {
        wrapper,
      });

      await result.current.mutateAsync({ id: 'test-id', data: updateData });
      expect(productsService.update).toHaveBeenCalledWith('test-id', updateData);
    });
  });

  describe('useDeleteProduct', () => {
    it('deve deletar produto com sucesso', async () => {
      vi.mocked(productsService.delete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteProduct(), {
        wrapper,
      });

      await result.current.mutateAsync('test-id');
      expect(productsService.delete).toHaveBeenCalledWith('test-id');
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Sucesso',
          description: 'Produto deletado com sucesso!',
        })
      );
    });
  });
});