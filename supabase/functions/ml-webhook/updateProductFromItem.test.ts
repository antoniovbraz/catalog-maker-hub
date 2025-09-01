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
    mappingQuery.single.mockResolvedValue({ data: { product_id: 'prod-1' }, error: null });
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
      seller_sku: 'SKU1',
      attributes: [],
      pictures: [{ url: 'pic1' }],
      available_quantity: 3,
    };

    const fields = await updateProductFromItem(supabase, 'tenant1', itemData, 'token');

    expect(mappingQuery.select).toHaveBeenCalledWith('product_id');
    expect(productsQuery.update).toHaveBeenCalled();
    expect(productsQuery.eq).toHaveBeenCalledWith('id', 'prod-1');
    expect(productsQuery.eq).toHaveBeenCalledWith('tenant_id', 'tenant1');
    expect(fields).toEqual(['sku', 'description', 'attributes', 'pictures', 'stock']);
  });
});
