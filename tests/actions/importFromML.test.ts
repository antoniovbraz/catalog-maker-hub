import { describe, it, expect, vi, afterEach } from 'vitest';
import { importFromML, parseWeight, weightToGrams } from '../../supabase/functions/ml-sync-v2/actions/importFromML.ts';

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

describe('importFromML action', () => {
  it('imports more than 1000 items using pagination total', async () => {
    const totalItems = 1050;

    global.fetch = vi.fn((input: any) => {
      const url = input.toString();
      if (url.includes('/users/me/items/search')) {
        const urlObj = new URL(url);
        const offset = Number(urlObj.searchParams.get('offset'));
        const limit = Number(urlObj.searchParams.get('limit'));
        const remaining = Math.max(0, totalItems - offset);
        const batchSize = Math.min(limit, remaining);
        const results = Array.from({ length: batchSize }, (_, i) => `ML${offset + i}`);
        return Promise.resolve({
          ok: true,
          json: async () => ({ results, paging: { total: totalItems, offset, limit } }),
        } as any);
      }
      if (url.includes('/items/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 'item', title: 'Item', sale_terms: [], category_id: null, price: 0 }),
        } as any);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any);
    });

    const productsTable = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'prod' } }),
    };
    const mappingTable = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      upsert: vi.fn().mockResolvedValue({}),
    };
    const mlSyncLogTable = { insert: vi.fn().mockResolvedValue({}) };

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'products') return productsTable;
        if (table === 'ml_product_mapping') return mappingTable;
        if (table === 'ml_sync_log') return mlSyncLogTable;
        return {} as any;
      }),
    } as any;

    const response = await importFromML({ action: 'import_from_ml' } as any, {
      supabase,
      tenantId: 'tenant1',
      authToken: {},
      mlToken: 'token',
      mlClientId: 'client',
      jwt: 'jwt',
    });

    const result = await response.json();
    expect(result.total_processed).toBe(totalItems);
    expect(mappingTable.upsert).toHaveBeenCalledTimes(totalItems);
  });
});

describe('weight parsing', () => {
  it.each([
    ['500 g', 500],
    ['0.5 kg', 500],
    ['2kg', 2000],
    ['1,2 kg', 1200],
  ])('converts %s to %d grams', (input, expected) => {
    const parsed = parseWeight(input);
    expect(parsed).not.toBeNull();
    const grams = weightToGrams(parsed!.value, parsed!.unit);
    expect(grams).toBeCloseTo(expected);
  });
});
