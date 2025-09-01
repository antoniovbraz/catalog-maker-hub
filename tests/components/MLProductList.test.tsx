import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MLProductList } from '@/components/ml/MLProductList';

vi.mock('@/hooks/useMLProducts', () => ({
  useMLProducts: vi.fn(),
}));

vi.mock('@/hooks/useMLIntegration', () => ({
  useMLSync: vi.fn(),
}));

import { useMLProducts } from '@/hooks/useMLProducts';
import { useMLSync } from '@/hooks/useMLIntegration';

describe('MLProductList', () => {
  it('should call sync even when required fields are missing', () => {
    const syncMutate = vi.fn();
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

    render(<MLProductList />);

    const row = screen.getByText('Produto Teste').closest('tr')!;
    const button = within(row).getByRole('button');
    fireEvent.click(button);

    expect(syncMutate).toHaveBeenCalledWith('1');
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

    render(<MLProductList />);

    const row = screen.getByText('Produto Completo').closest('tr')!;
    const button = within(row).getByRole('button');
    fireEvent.click(button);

    expect(syncMutate).toHaveBeenCalledWith('1');
  });
});
