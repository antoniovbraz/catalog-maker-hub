import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MLProductList } from '@/components/ml/MLProductList';
import { toast } from '@/hooks/use-toast';

vi.mock('@/hooks/useMLProducts', () => ({
  useMLProducts: vi.fn(),
}));

vi.mock('@/hooks/useMLIntegration', () => ({
  useMLSync: vi.fn(),
}));

vi.mock('@/hooks/useMLProductResync', () => ({
  useMLProductResync: vi.fn(),
}));

import { useMLProducts } from '@/hooks/useMLProducts';
import { useMLSync } from '@/hooks/useMLIntegration';
import { useMLProductResync } from '@/hooks/useMLProductResync';

describe('MLProductList', () => {
  it('should attempt auto-import when required fields are missing', async () => {
    const syncMutate = vi.fn();
    const resyncMutateAsync = vi.fn().mockResolvedValue(undefined);
    (useMLProducts as vi.Mock).mockReturnValue({
      data: [
        {
          id: '1',
          name: 'Produto Teste',
          sync_status: 'not_synced',
        },
      ],
      isLoading: false,
    });
    (useMLSync as vi.Mock).mockReturnValue({
      syncProduct: { mutate: syncMutate, isPending: false },
      syncBatch: { mutate: vi.fn(), isPending: false },
    });
    (useMLProductResync as vi.Mock).mockReturnValue({
      resyncProduct: { mutateAsync: resyncMutateAsync, isPending: false, variables: undefined },
    });

    render(<MLProductList />);

    const row = screen.getByText('Produto Teste').closest('tr')!;
    const button = within(row).getByRole('button');
    fireEvent.click(button);

    expect(resyncMutateAsync).toHaveBeenCalledWith({ productId: '1' });
    await waitFor(() => expect(syncMutate).toHaveBeenCalledWith('1'));
    expect(toast).toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining('Importando automaticamente do Mercado Livre'),
      })
    );
  });

  it('should call sync when all required fields are present', () => {
    const syncMutate = vi.fn();
    (useMLProducts as vi.Mock).mockReturnValue({
      data: [
        {
          id: '1',
          name: 'Produto Completo',
          sku: 'SKU-1',
          description: 'desc',
          cost_unit: 100,
          image_url: 'http://example.com/img.jpg',
          sync_status: 'not_synced',
        },
      ],
      isLoading: false,
    });
    (useMLSync as vi.Mock).mockReturnValue({
      syncProduct: { mutate: syncMutate, isPending: false },
      syncBatch: { mutate: vi.fn(), isPending: false },
    });
    (useMLProductResync as vi.Mock).mockReturnValue({
      resyncProduct: { mutateAsync: vi.fn(), isPending: false, variables: undefined },
    });

    render(<MLProductList />);

    const row = screen.getByText('Produto Completo').closest('tr')!;
    const button = within(row).getByRole('button');
    fireEvent.click(button);

    expect(syncMutate).toHaveBeenCalledWith('1');
  });
});

