import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { updateProductFromItem, type SupabaseClient, type ItemData } from './updateProductFromItem';
import type { PostgrestQueryMock } from '../../../tests/types/postgrest';

const mappingQuery = {
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
} as unknown as PostgrestQueryMock<{ product_id: string; ml_variation_id: string }>;
let eqCall = 0;
const productsQuery = {
  update: vi.fn(),
  eq: vi.fn(),
} as unknown as PostgrestQueryMock<unknown>;

const supabase = {
  from: vi.fn((table: string) => {
    if (table === 'ml_product_mapping') {
      return mappingQuery;
    }
    if (table === 'products') {
      return productsQuery;
    }
  }),
} as unknown as SupabaseClient & { from: Mock };

describe('updateProductFromItem', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (mappingQuery.select as Mock).mockReturnValue(mappingQuery);
    (mappingQuery.eq as Mock).mockReturnValue(mappingQuery);
    (mappingQuery.single as Mock).mockResolvedValue({ data: { product_id: 'prod-1', ml_variation_id: 'VAR1' }, error: null });
    eqCall = 0;
    (productsQuery.update as Mock).mockReturnValue(productsQuery);
    (productsQuery.eq as Mock).mockImplementation(() => {
      eqCall += 1;
      if (eqCall === 2) {
        return Promise.resolve({ error: null });
      }
      return productsQuery;
    });
    (supabase.from as Mock).mockImplementation((table: string) => {
      if (table === 'ml_product_mapping') return mappingQuery;
      if (table === 'products') return productsQuery;
    });
    globalThis.fetch = vi.fn((url: RequestInfo) => {
      const urlStr = url.toString();
      if (urlStr.includes('/description')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ plain_text: 'desc' }) });
      }
      if (urlStr.includes('/categories')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ path_from_root: [{ name: 'Root' }] }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }) as unknown as typeof fetch;
  });

  it('updates product fields from item data', async () => {
    const itemData: ItemData = {
      id: 'ML1',
      seller_custom_field: 'SCF1',
      attributes: [],
      pictures: [{ url: 'pic1' }],
      available_quantity: 3,
      category_id: 'CAT1'
    };

    const fields = await updateProductFromItem(supabase, 'tenant1', itemData, 'token');

    expect(mappingQuery.select).toHaveBeenCalledWith('product_id, ml_variation_id');
    expect(productsQuery.update).toHaveBeenCalled();
    expect(productsQuery.eq).toHaveBeenCalledWith('id', 'prod-1');
    expect(productsQuery.eq).toHaveBeenCalledWith('tenant_id', 'tenant1');
    expect(fields).toEqual(['sku', 'attributes', 'pictures', 'stock', 'description']);
    const updateArgs = productsQuery.update.mock.calls[0][0];
    expect(updateArgs.category_ml_id).toBe('CAT1');
    expect(updateArgs.category_ml_path).toBe('Root');
  });

  it('skips description update when fetch fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;

    const itemData: ItemData = {
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
    const itemData: ItemData = {
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
      data: { product_id: 'prod-2', ml_variation_id: '67890' },
      error: null,
    });
    const itemData: ItemData = {
      id: 'ML4',
      attributes: [],
      pictures: [],
      available_quantity: 1,
      // ML returns numeric variation IDs
      variations: [{ id: 67890, seller_sku: 'VSKU2' }],
    };

    await updateProductFromItem(supabase, 'tenant1', itemData, 'token');

    const updateArg = productsQuery.update.mock.calls[0][0];
    expect(updateArg.sku).toBe('VSKU2');
    expect(updateArg.sku_source).toBe('mercado_livre');
    expect(updateArg.ml_variation_id).toBe('67890');
  });

  it('throws when product mapping is missing (disconnected)', async () => {
    mappingQuery.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });
    await expect(
      updateProductFromItem(supabase, 'tenant1', { id: 'MLX' } as ItemData, 'token')
    ).rejects.toThrow('Product mapping not found');
  });
});
