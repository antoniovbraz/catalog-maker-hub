 
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('../../supabase/functions/ml-sync-v2/actions/resyncProduct.ts', () => ({
  resyncProduct: vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 })),
}));

import {
  importFromML,
  parseWeight,
  weightToGrams,
} from '../../supabase/functions/ml-sync-v2/actions/importFromML.ts';
import { resyncProduct } from '../../supabase/functions/ml-sync-v2/actions/resyncProduct.ts';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

describe('importFromML action', () => {
  it('uses seller_custom_field as sku and saves category path', async () => {
    const itemData = {
      id: 'MLA1',
      title: 'Test Item',
      attributes: [],
      price: 100,
      available_quantity: 10,
      sold_quantity: 0,
      seller_custom_field: 'SCF123',
      category_id: 'CAT1',
      variations: [],
      pictures: [],
    } as any;

    global.fetch = vi.fn((url: RequestInfo) => {
      const urlStr = url.toString();
      if (urlStr.includes('/items/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            results: ['MLA1'],
            paging: { total: 1, offset: 0, limit: 50 },
          }),
        } as any);
      }
      if (urlStr.includes('/items/MLA1/description')) {
        return Promise.resolve({ ok: true, json: async () => ({ plain_text: '' }) } as any);
      }
      if (urlStr.includes('/items/MLA1')) {
        return Promise.resolve({ ok: true, json: async () => itemData } as any);
      }
      if (urlStr.includes('/categories/CAT1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ name: 'Root', path_from_root: [{ id: 'CAT1', name: 'Root' }] }),
        } as any);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any);
    });

    const productsTable = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'prod1' }, error: null }),
    };
    const mappingTable = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    };
    const mlSyncLogTable = { insert: vi.fn().mockResolvedValue({}) };
    const productImagesTable = { insert: vi.fn().mockResolvedValue({ error: null }) };
    const mlCategoriesTable = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'mlcat' }, error: null }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({}),
    };
    const categoriesTable = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'catLocal' } }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    };

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'products') return productsTable;
        if (table === 'ml_product_mapping') return mappingTable;
        if (table === 'ml_sync_log') return mlSyncLogTable;
        if (table === 'product_images') return productImagesTable;
        if (table === 'ml_categories') return mlCategoriesTable;
        if (table === 'categories') return categoriesTable;
        return {
          upsert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          ilike: vi.fn().mockReturnThis(),
        };
      }),
    } as any;

    await importFromML({ action: 'import_from_ml' } as any, {
      supabase,
      tenantId: 'tenant1',
      authToken: { user_id_ml: 'user1', access_token: 'token' } as any,
      mlToken: 'token',
    });

    expect(productsTable.upsert).toHaveBeenCalled();
    const inserted = productsTable.upsert.mock.calls[0][0];
    expect(inserted.sku).toBe('SCF123');
    expect(inserted.sku_source).toBe('mercado_livre');
    expect(inserted.category_ml_path).toBe('Root');
  });

  it('uses seller_sku as sku when seller_custom_field is missing', async () => {
    const itemData = {
      id: 'MLA1',
      title: 'Test Item',
      attributes: [],
      price: 100,
      available_quantity: 10,
      sold_quantity: 0,
      seller_sku: 'SSKU123',
      category_id: null,
      variations: [],
      pictures: [],
    } as any;

    global.fetch = vi.fn((url: RequestInfo) => {
      const urlStr = url.toString();
      if (urlStr.includes('/items/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            results: ['MLA1'],
            paging: { total: 1, offset: 0, limit: 50 },
          }),
        } as any);
      }
      if (urlStr.includes('/items/MLA1/description')) {
        return Promise.resolve({ ok: true, json: async () => ({ plain_text: '' }) } as any);
      }
      if (urlStr.includes('/items/MLA1')) {
        return Promise.resolve({ ok: true, json: async () => itemData } as any);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any);
    });

    const productsTable = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'prod1' }, error: null }),
    };
    const mappingTable = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    };
    const mlSyncLogTable = { insert: vi.fn().mockResolvedValue({}) };
    const productImagesTable = { insert: vi.fn().mockResolvedValue({ error: null }) };

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'products') return productsTable;
        if (table === 'ml_product_mapping') return mappingTable;
        if (table === 'ml_sync_log') return mlSyncLogTable;
        if (table === 'product_images') return productImagesTable;
        return {
          upsert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          ilike: vi.fn().mockReturnThis(),
        };
      }),
    } as any;

    await importFromML({ action: 'import_from_ml' } as any, {
      supabase,
      tenantId: 'tenant1',
      authToken: { user_id_ml: 'user1', access_token: 'token' } as any,
      mlToken: 'token',
    });

    expect(productsTable.upsert).toHaveBeenCalled();
    const inserted = productsTable.upsert.mock.calls[0][0];
    expect(inserted.sku).toBe('SSKU123');
    expect(inserted.sku_source).toBe('mercado_livre');
  });

  it('falls back to null sku when not provided', async () => {
    const itemData = {
      id: 'MLA2',
      title: 'No SKU Item',
      attributes: [],
      price: 50,
      available_quantity: 5,
      sold_quantity: 0,
      category_id: null,
      variations: [],
      pictures: [],
    } as any;

    global.fetch = vi.fn((url: RequestInfo) => {
      const urlStr = url.toString();
      if (urlStr.includes('/items/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            results: ['MLA2'],
            paging: { total: 1, offset: 0, limit: 50 },
          }),
        } as any);
      }
      if (urlStr.includes('/items/MLA2/description')) {
        return Promise.resolve({ ok: true, json: async () => ({ plain_text: '' }) } as any);
      }
      if (urlStr.includes('/items/MLA2')) {
        return Promise.resolve({ ok: true, json: async () => itemData } as any);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any);
    });

    const productsTable = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'prod2' }, error: null }),
    };
    const mappingTable = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    };
    const mlSyncLogTable = { insert: vi.fn().mockResolvedValue({}) };
    const productImagesTable = { insert: vi.fn().mockResolvedValue({ error: null }) };

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'products') return productsTable;
        if (table === 'ml_product_mapping') return mappingTable;
        if (table === 'ml_sync_log') return mlSyncLogTable;
        if (table === 'product_images') return productImagesTable;
        return {
          upsert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          ilike: vi.fn().mockReturnThis(),
        };
      }),
    } as any;

    await importFromML({ action: 'import_from_ml' } as any, {
      supabase,
      tenantId: 'tenant1',
      authToken: { user_id_ml: 'user1', access_token: 'token' } as any,
      mlToken: 'token',
    });

    expect(productsTable.upsert).toHaveBeenCalled();
    const inserted = productsTable.upsert.mock.calls[0][0];
    expect(inserted.sku).toBeNull();
    expect(inserted.sku_source).toBe('none');
  });

  it('chama resyncProduct quando já existe mapeamento', async () => {
    global.fetch = vi.fn((url: RequestInfo) => {
      const urlStr = url.toString();
      if (urlStr.includes('/items/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ results: ['MLX1'], paging: { total: 1, offset: 0, limit: 50 } }),
        } as any);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any);
    });

    const mappingTable = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { product_id: 'prod1' } }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    };

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'ml_product_mapping') return mappingTable;
        return {
          upsert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          ilike: vi.fn().mockReturnThis(),
        };
      }),
    } as any;

    await importFromML({ action: 'import_from_ml' } as any, {
      supabase,
      tenantId: 'tenant1',
      authToken: { user_id_ml: 'user1', access_token: 'token' } as any,
      mlToken: 'token',
    });

    expect(resyncProduct).toHaveBeenCalledWith(
      { action: 'resync_product', productId: 'prod1' },
      expect.objectContaining({ tenantId: 'tenant1' })
    );
  });
});

describe('weight parsing', () => {
  it.each([
    ['500 g', 500],
    ['0.5 kg', 500],
    ['2kg', 2000],
    ['1,2 kg', 1200],
  ])('converts %s to %d grams', (input, expected) => {
    const { value, unit } = parseWeight(input);
    const grams = weightToGrams(value, unit);
    expect(grams).toBeCloseTo(expected);
  });
});
