import { describe, it, expect, vi, type Mock, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Products from '@/pages/Products';
import { MemoryRouter } from 'react-router-dom';
import { testUtils } from '../setup';
import { useProductsWithCategories } from '@/hooks/useProducts';

vi.mock('@/hooks/useMLProducts', () => ({
  useMLProducts: () => ({ data: { pages: [] } }),
}));

vi.mock('@/hooks/useMLIntegration', () => ({
  useMLIntegration: () => ({
    sync: {
      syncProduct: { mutate: vi.fn(), isPending: false },
      syncBatch: { mutate: vi.fn(), isPending: false },
      importFromML: { mutate: vi.fn(), isPending: false },
    },
    writeEnabled: true,
    syncStatusQuery: { data: null },
  }),
}));

vi.mock('@/hooks/useMLProductResync', () => ({
  useMLProductResync: () => ({ resyncProduct: { mutate: vi.fn(), isPending: false } }),
}));

vi.mock('@/hooks/useProducts', () => ({
  useProductsWithCategories: vi.fn(),
  useDeleteProduct: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/hooks/useGlobalModal', () => ({
  useGlobalModal: () => ({ showFormModal: vi.fn(), showConfirmModal: vi.fn() }),
}));

afterEach(() => {
  vi.resetModules();
});

describe('Products page', () => {
  it('exibe SKU do ML com badge e sem SKU interno', () => {
    const products = [
      testUtils.createMockProduct({
        id: '1',
        name: 'Produto ML',
        source: 'mercado_livre',
        ml_seller_sku: 'ML-SKU-1',
        sku: 'INTERNAL',
        brand: 'Marca',
      }),
    ];

    (useProductsWithCategories as Mock).mockReturnValue({
      data: products,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    expect(screen.getByText('ML-SKU-1')).toBeInTheDocument();
    expect(screen.getByText('SKU Original ML')).toBeInTheDocument();
    expect(screen.queryByText('INTERNAL')).not.toBeInTheDocument();
  });

  it('mostra traço e tooltip quando SKU do ML ausente', async () => {
    const products = [
      testUtils.createMockProduct({
        id: '1',
        name: 'Produto ML',
        source: 'mercado_livre',
        ml_seller_sku: undefined,
        sku: undefined,
        brand: 'Marca',
      }),
    ];

    (useProductsWithCategories as Mock).mockReturnValue({
      data: products,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    const dash = screen.getByText('—');
    const user = userEvent.setup();
    await user.hover(dash);
    const tooltips = await screen.findAllByText('Defina o SKU no ML');
    expect(tooltips.length).toBeGreaterThan(0);
  });
});
