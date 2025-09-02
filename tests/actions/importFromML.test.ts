/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  importFromML,
  parseWeight,
  weightToGrams,
} from '../../supabase/functions/ml-sync-v2/actions/importFromML.ts';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

describe('importFromML action', () => {
  it('should save variations in product record', async () => {
    const itemData = {
      id: 'MLA1',
      title: 'Test Item',
      attributes: [],
      price: 100,
      available_quantity: 10,
      sold_quantity: 0,
      seller_sku: 'SELLER',
      variations: [{ id: 'VAR1', attribute_combinations: [] }],
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
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'prod1' }, error: null }),
    };
    const mappingTable = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    const mlSyncLogTable = { insert: vi.fn().mockResolvedValue({}) };

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'products') return productsTable;
        if (table === 'ml_product_mapping') return mappingTable;
        if (table === 'ml_sync_log') return mlSyncLogTable;
        return {
          upsert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockReturnThis(),
          ilike: vi.fn().mockReturnThis(),
        };
      }),
    } as any;

    await importFromML({ action: 'import_from_ml' } as any, {
      supabase,
      tenantId: 'tenant1',
      authToken: { user_id_ml: 'user1', access_token: 'token' } as any,
    });

    expect(productsTable.insert).toHaveBeenCalled();
    const inserted = productsTable.insert.mock.calls[0][0];
    expect(inserted.ml_variations).toEqual(itemData.variations);
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
