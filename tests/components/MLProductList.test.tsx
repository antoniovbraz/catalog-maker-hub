import { describe, it, expect, vi, type Mock } from 'vitest';
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
    (useMLProducts as Mock).mockReturnValue({
      data: [
        {
          id: '1',
          name: 'Produto Teste',
          sync_status: 'not_synced',
        },
      ],
      isLoading: false,
    });
    (useMLSync as Mock).mockReturnValue({
      syncProduct: { mutate: syncMutate, isPending: false },
      syncBatch: { mutate: vi.fn(), isPending: false },
      importFromML: { mutate: vi.fn(), isPending: false },
    });

    render(<MLProductList />);

    const row = screen.getByText('Produto Teste').closest('tr')!;
    const button = within(row).getByLabelText('Enviar ao Mercado Livre');
    fireEvent.click(button);

    expect(syncMutate).toHaveBeenCalledWith('1');
  });

  it('should call sync when all required fields are present', () => {
    const syncMutate = vi.fn();
    (useMLProducts as Mock).mockReturnValue({
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
    (useMLSync as Mock).mockReturnValue({
      syncProduct: { mutate: syncMutate, isPending: false },
      syncBatch: { mutate: vi.fn(), isPending: false },
      importFromML: { mutate: vi.fn(), isPending: false },
    });

    render(<MLProductList />);

    const row = screen.getByText('Produto Completo').closest('tr')!;
    const button = within(row).getByLabelText('Enviar ao Mercado Livre');
    fireEvent.click(button);

    expect(syncMutate).toHaveBeenCalledWith('1');
  });

  it('should call importFromML when clicking Importar do ML', () => {
    const importMutate = vi.fn();
    (useMLProducts as Mock).mockReturnValue({
      data: [
        {
          id: '1',
          name: 'Produto sem ML',
          sync_status: 'not_synced',
        },
      ],
      isLoading: false,
    });
    (useMLSync as Mock).mockReturnValue({
      syncProduct: { mutate: vi.fn(), isPending: false },
      syncBatch: { mutate: vi.fn(), isPending: false },
      importFromML: { mutate: importMutate, isPending: false },
    });

    render(<MLProductList />);

    const button = screen.getByRole('button', { name: /importar do ml/i });
    fireEvent.click(button);

    expect(importMutate).toHaveBeenCalled();
  });
});
