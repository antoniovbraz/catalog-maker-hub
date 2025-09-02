import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductModalForm } from '@/components/forms/ProductModalForm';
import { testUtils } from '../setup';
import type { ProductWithCategory } from '@/types/products';

vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({ data: [] }),
}));

vi.mock('@/hooks/useProducts', () => ({
  useCreateProduct: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateProduct: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/hooks/useCollapsibleSection', () => ({
  useCollapsibleSection: () => ({ isOpen: true, toggle: vi.fn() }),
}));

describe('ProductModalForm', () => {
  const noop = () => {};

  it('esconde campo SKU para produtos do Mercado Livre', () => {
    const product = testUtils.createMockProduct({
      source: 'mercado_livre',
    }) as ProductWithCategory;

    render(
      <ProductModalForm
        product={product}
        onSuccess={noop}
        onSubmitForm={noop}
      />
    );

    expect(screen.queryByLabelText(/SKU/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/SKU deve ser definido no Mercado Livre/i)
    ).toBeInTheDocument();
  });

  it('exibe campo SKU para produtos manuais', () => {
    const product = testUtils.createMockProduct({ source: 'manual' }) as ProductWithCategory;

    render(
      <ProductModalForm
        product={product}
        onSuccess={noop}
        onSubmitForm={noop}
      />
    );

    expect(screen.getByLabelText(/SKU/i)).toBeInTheDocument();
  });
});
