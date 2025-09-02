import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateProductFromItem } from './updateProductFromItem';

const mappingQuery = {
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
};
let eqCall = 0;
const productsQuery = {
  update: vi.fn(),
  eq: vi.fn(),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase: any = {
  from: vi.fn((table: string) => {
    if (table === 'ml_product_mapping') {
      return mappingQuery;
    }
    if (table === 'products') {
      return productsQuery;
    }
  }),
};

describe('updateProductFromItem', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mappingQuery.select.mockReturnValue(mappingQuery);
    mappingQuery.eq.mockReturnValue(mappingQuery);
    mappingQuery.single.mockResolvedValue({ data: { product_id: 'prod-1', ml_variation_id: 'VAR1' }, error: null });
    eqCall = 0;
    productsQuery.update.mockReturnValue(productsQuery);
    productsQuery.eq.mockImplementation(() => {
      eqCall += 1;
      if (eqCall === 2) {
        return Promise.resolve({ error: null });
      }
      return productsQuery;
    });
    supabase.from.mockImplementation((table: string) => {
      if (table === 'ml_product_mapping') return mappingQuery;
      if (table === 'products') return productsQuery;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ plain_text: 'desc' }),
    });
  });

  it('updates product fields from item data', async () => {
    const itemData = {
      id: 'ML1',
      seller_custom_field: 'SCF1',
      attributes: [],
      pictures: [{ url: 'pic1' }],
      available_quantity: 3,
    };

    const fields = await updateProductFromItem(supabase, 'tenant1', itemData, 'token');

    expect(mappingQuery.select).toHaveBeenCalledWith('product_id, ml_variation_id');
    expect(productsQuery.update).toHaveBeenCalled();
    expect(productsQuery.eq).toHaveBeenCalledWith('id', 'prod-1');
    expect(productsQuery.eq).toHaveBeenCalledWith('tenant_id', 'tenant1');
    expect(fields).toEqual(['sku', 'attributes', 'pictures', 'stock', 'description']);
  });

  it('skips description update when fetch fails', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: false });

    const itemData = {
      id: 'ML2',
      seller_custom_field: 'SCF2',
      attributes: [],
      pictures: [{ url: 'pic2' }],
      available_quantity: 5,
    };

    const fields = await updateProductFromItem(supabase, 'tenant1', itemData, 'token');

    const updateArg = productsQuery.update.mock.calls[0][0];
    expect(updateArg).not.toHaveProperty('description');
    expect(fields).toEqual(['sku', 'attributes', 'pictures', 'stock']);
  });

  it('sets sku to null when ML does not provide', async () => {
    const itemData = {
      id: 'ML3',
      attributes: [],
      pictures: [],
      available_quantity: 1,
    };

    await updateProductFromItem(supabase, 'tenant1', itemData, 'token');

    const updateArg = productsQuery.update.mock.calls[0][0];
    expect(updateArg.sku).toBeNull();
    expect(updateArg.sku_source).toBe('none');
    expect(updateArg).toHaveProperty('updated_from_ml_at');
  });

  it('uses variation seller_sku when item-level sku missing', async () => {
    mappingQuery.single.mockResolvedValueOnce({
      data: { product_id: 'prod-2', ml_variation_id: 'VAR2' },
      error: null,
    });
    const itemData = {
      id: 'ML4',
      attributes: [],
      pictures: [],
      available_quantity: 1,
      variations: [{ id: 'VAR2', seller_sku: 'VSKU2' }],
    };

    await updateProductFromItem(supabase, 'tenant1', itemData, 'token');

    const updateArg = productsQuery.update.mock.calls[0][0];
    expect(updateArg.sku).toBe('VSKU2');
    expect(updateArg.sku_source).toBe('mercado_livre');
    expect(updateArg.ml_variation_id).toBe('VAR2');
  });
});
