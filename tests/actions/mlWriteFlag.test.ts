import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('../../supabase/functions/ml-sync-v2/actions/syncProduct.ts', async () => {
  const { isMLWriteEnabled } = await vi.importActual<
    typeof import('../../supabase/functions/shared/write-guard.ts')
  >('../../supabase/functions/shared/write-guard.ts');

  const syncSingleProduct = vi.fn().mockResolvedValue({ success: true });
  return {
    syncSingleProduct,
    async syncProduct(req: any, ctx: any) {
      if (!isMLWriteEnabled()) {
        return new Response(null, { status: 403 });
      }
      await syncSingleProduct(
        ctx.supabase,
        ctx.tenantId,
        req.product_id,
        ctx.mlToken,
        req.force_update
      );
      return new Response(null, { status: 200 });
    },
  };
});

import * as syncModule from '../../supabase/functions/ml-sync-v2/actions/syncProduct.ts';
import { createAd } from '../../supabase/functions/ml-sync-v2/actions/createAd.ts';

const baseContext = { supabase: {} as any, tenantId: 'tenant1', mlToken: 'token' } as any;

afterEach(() => {
  delete process.env.ML_WRITE_ENABLED;
  vi.restoreAllMocks();
});

describe('ML write flag', () => {
  it('blocks syncProduct when disabled', async () => {
    process.env.ML_WRITE_ENABLED = 'false';
    const response = await syncModule.syncProduct(
      { action: 'sync_product', product_id: 'prod1' },
      baseContext
    );
    expect(response.status).toBe(403);
  });

  it('allows syncProduct when enabled', async () => {
    process.env.ML_WRITE_ENABLED = 'true';
    const response = await syncModule.syncProduct(
      { action: 'sync_product', product_id: 'prod1' },
      baseContext
    );

    expect(syncModule.syncSingleProduct).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('blocks createAd when disabled', async () => {
    process.env.ML_WRITE_ENABLED = 'false';
    const supabase = { from: vi.fn().mockReturnThis(), insert: vi.fn() } as any;
    const response = await createAd(
      { action: 'create_ad', ad_data: {} },
      { supabase, tenantId: 'tenant1' } as any
    );
    expect(response.status).toBe(403);
  });

  it('allows createAd when enabled', async () => {
    process.env.ML_WRITE_ENABLED = 'true';
    const insert = vi.fn().mockResolvedValue({});
    const supabase = { from: vi.fn().mockReturnValue({ insert }) } as any;
    const response = await createAd(
      { action: 'create_ad', ad_data: {} },
      { supabase, tenantId: 'tenant1' } as any
    );
    expect(insert).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });
});
