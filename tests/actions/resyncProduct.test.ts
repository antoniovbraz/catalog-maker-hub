 
import { describe, it, expect, vi, afterEach } from 'vitest';
import { resyncProduct } from '../../supabase/functions/ml-sync-v2/actions/resyncProduct.ts';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

describe('resyncProduct action', () => {
  it('should map item price to cost_unit when local value is missing or zero', async () => {
    const itemData = {
      id: 'MLA1',
      title: 'Test Item',
      price: 123.45,
      attributes: [],
      available_quantity: 0,
      sold_quantity: 0,
      seller_sku: '',
      variations: [],
      pictures: [],
    } as any;

    global.fetch = vi.fn((url: RequestInfo) => {
      if (url.toString().includes('/description')) {
        return Promise.resolve({ ok: true, json: async () => ({ plain_text: '' }) } as any);
      }
      return Promise.resolve({ ok: true, json: async () => itemData } as any);
    });

    const productsTable = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      error: null,
    };
    const mappingTable = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ml_item_id: 'MLA1', products: { id: 'prod1', cost_unit: 0 } },
        error: null,
      }),
      update: vi.fn().mockReturnThis(),
    };
    const mlSyncLogTable = { insert: vi.fn().mockResolvedValue({}) };

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'ml_product_mapping') return mappingTable;
        if (table === 'products') return productsTable;
        if (table === 'ml_sync_log') return mlSyncLogTable;
        return { upsert: vi.fn().mockResolvedValue({}), update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      }),
    } as any;

    await resyncProduct({ action: 'resync_product', productId: 'prod1' }, { 
      supabase, 
      tenantId: 'tenant1', 
      mlToken: 'token',
      authToken: {},
      mlClientId: 'test',
      jwt: 'test'
    });

    expect(productsTable.update).toHaveBeenCalled();
    const updateArg = productsTable.update.mock.calls[0][0];
    expect(updateArg.cost_unit).toBe(itemData.price);
    expect(updateArg.name).toBe(itemData.title);
  });

  it('should not override existing cost_unit', async () => {
    const itemData = {
      id: 'MLA2',
      title: 'Another Item',
      price: 99.9,
      attributes: [],
      available_quantity: 0,
      sold_quantity: 0,
      seller_sku: '',
      variations: [],
      pictures: [],
    } as any;

    global.fetch = vi.fn((url: RequestInfo) => {
      if (url.toString().includes('/description')) {
        return Promise.resolve({ ok: true, json: async () => ({ plain_text: '' }) } as any);
      }
      return Promise.resolve({ ok: true, json: async () => itemData } as any);
    });

    const productsTable = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      error: null,
    };
    const mappingTable = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ml_item_id: 'MLA2', products: { id: 'prod2', cost_unit: 50, name: 'Local Name' } },
        error: null,
      }),
      update: vi.fn().mockReturnThis(),
    };
    const mlSyncLogTable = { insert: vi.fn().mockResolvedValue({}) };

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'ml_product_mapping') return mappingTable;
        if (table === 'products') return productsTable;
        if (table === 'ml_sync_log') return mlSyncLogTable;
        return { upsert: vi.fn().mockResolvedValue({}), update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      }),
    } as any;

    await resyncProduct({ action: 'resync_product', productId: 'prod2' }, { 
      supabase, 
      tenantId: 'tenant1', 
      mlToken: 'token',
      authToken: {},
      mlClientId: 'test',
      jwt: 'test'
    });

    expect(productsTable.update).toHaveBeenCalled();
    const updateArg = productsTable.update.mock.calls[0][0];
    expect(updateArg.cost_unit).toBeUndefined();
    expect(updateArg.name).toBeUndefined();
  });

  it('sets sku to null when ML does not provide', async () => {
    const itemData = {
      id: 'MLA4',
      title: 'No SKU Item',
      price: 10,
      attributes: [],
      available_quantity: 0,
      sold_quantity: 0,
      pictures: [],
    } as any;

    global.fetch = vi.fn((url: RequestInfo) => {
      if (url.toString().includes('/description')) {
        return Promise.resolve({ ok: true, json: async () => ({ plain_text: '' }) } as any);
      }
      return Promise.resolve({ ok: true, json: async () => itemData } as any);
    });

    const productsTable = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      error: null,
    };
    const mappingTable = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ml_item_id: 'MLA4', products: { id: 'prod4', cost_unit: 0 } },
        error: null,
      }),
      update: vi.fn().mockReturnThis(),
    };
    const mlSyncLogTable = { insert: vi.fn().mockResolvedValue({}) };

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'ml_product_mapping') return mappingTable;
        if (table === 'products') return productsTable;
        if (table === 'ml_sync_log') return mlSyncLogTable;
        return { upsert: vi.fn().mockResolvedValue({}), update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      }),
    } as any;

    await resyncProduct({ action: 'resync_product', productId: 'prod4' }, {
      supabase,
      tenantId: 'tenant1',
      mlToken: 'token',
      authToken: {},
      mlClientId: 'test',
      jwt: 'test'
    });

    const updateArg = productsTable.update.mock.calls[0][0];
    expect(updateArg.sku).toBeNull();
    expect(updateArg.sku_source).toBe('none');
    expect(updateArg).toHaveProperty('updated_from_ml_at');
  });

  it('uses variation seller_sku when item-level sku is missing', async () => {
    const itemData = {
      id: 'MLA5',
      title: 'Variation SKU Item',
      price: 10,
      attributes: [],
      available_quantity: 0,
      sold_quantity: 0,
      pictures: [],
      variations: [{ id: 'VAR1', seller_sku: 'VSKU1' }],
    } as any;

    global.fetch = vi.fn((url: RequestInfo) => {
      if (url.toString().includes('/description')) {
        return Promise.resolve({ ok: true, json: async () => ({ plain_text: '' }) } as any);
      }
      return Promise.resolve({ ok: true, json: async () => itemData } as any);
    });

    const productsTable = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      error: null,
    };
    const mappingTable = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          ml_item_id: 'MLA5',
          ml_variation_id: 'VAR1',
          products: { id: 'prod5', cost_unit: 0 },
        },
        error: null,
      }),
      update: vi.fn().mockReturnThis(),
    };
    const mlSyncLogTable = { insert: vi.fn().mockResolvedValue({}) };

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'ml_product_mapping') return mappingTable;
        if (table === 'products') return productsTable;
        if (table === 'ml_sync_log') return mlSyncLogTable;
        return { upsert: vi.fn().mockResolvedValue({}), update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      }),
    } as any;

    await resyncProduct({ action: 'resync_product', productId: 'prod5' }, {
      supabase,
      tenantId: 'tenant1',
      mlToken: 'token',
      authToken: {},
      mlClientId: 'test',
      jwt: 'test'
    });

    const updateArg = productsTable.update.mock.calls[0][0];
    expect(updateArg.sku).toBe('VSKU1');
    expect(updateArg.sku_source).toBe('mercado_livre');
    expect(updateArg.ml_variation_id).toBe('VAR1');
  });

  it('should normalize weight units to grams', async () => {
    const itemData = {
      id: 'MLA3',
      title: 'Weighted Item',
      price: 10,
      attributes: [
        {
          id: 'WEIGHT',
          value_name: '0.5 kg',
        },
      ],
      available_quantity: 0,
      sold_quantity: 0,
      seller_sku: '',
      variations: [],
      pictures: [],
    } as any;

    global.fetch = vi.fn((url: RequestInfo) => {
      if (url.toString().includes('/description')) {
        return Promise.resolve({ ok: true, json: async () => ({ plain_text: '' }) } as any);
      }
      return Promise.resolve({ ok: true, json: async () => itemData } as any);
    });

    const productsTable = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      error: null,
    };
    const mappingTable = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ml_item_id: 'MLA3', products: { id: 'prod3', cost_unit: 0 } },
        error: null,
      }),
      update: vi.fn().mockReturnThis(),
    };
    const mlSyncLogTable = { insert: vi.fn().mockResolvedValue({}) };

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'ml_product_mapping') return mappingTable;
        if (table === 'products') return productsTable;
        if (table === 'ml_sync_log') return mlSyncLogTable;
        return {
          upsert: vi.fn().mockResolvedValue({}),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        };
      }),
    } as any;

    await resyncProduct({ action: 'resync_product', productId: 'prod3' }, {
      supabase,
      tenantId: 'tenant1',
      mlToken: 'token',
      authToken: {},
      mlClientId: 'test',
      jwt: 'test'
    });

    const updateArg = productsTable.update.mock.calls[0][0];
    expect(updateArg.weight).toBeCloseTo(500);
  });
});
