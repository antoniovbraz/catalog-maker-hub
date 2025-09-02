import { ActionContext, SyncBatchRequest, errorResponse, corsHeaders } from '../types.ts';
import { syncSingleProduct } from './syncProduct.ts';
import { isMLWriteEnabled } from '../../shared/write-guard.ts';

export async function syncBatch(
  req: SyncBatchRequest,
  { supabase, tenantId, mlToken }: ActionContext
): Promise<Response> {
  if (!req.product_ids || !Array.isArray(req.product_ids)) {
    return errorResponse('Product IDs array required', 400);
  }

  if (!isMLWriteEnabled()) {
    return errorResponse('ML write operations disabled', 403);
  }

    const startTime = Date.now();
    try {
      const results: Array<{ product_id: string; success: boolean; [key: string]: unknown }> = [];
    for (const productId of req.product_ids) {
      try {
        const result = await syncSingleProduct(
          supabase,
          tenantId,
          productId,
          mlToken,
          req.force_update
        );
        results.push({ product_id: productId, ...result });
      } catch (error) {
        results.push({
          product_id: productId,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    const errors = results.filter((r) => !r.success).length;
    const status = errors > 0 ? 'error' : 'success';

    await supabase.from('ml_sync_log').insert({
      tenant_id: tenantId,
      operation_type: 'sync_batch',
      entity_type: 'batch',
      status,
      request_data: { product_count: req.product_ids.length },
      response_data: { results },
      execution_time_ms: Date.now() - startTime,
    });

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    await supabase.from('ml_sync_log').insert({
      tenant_id: tenantId,
      operation_type: 'sync_batch',
      entity_type: 'batch',
      status: 'error',
      request_data: { product_count: req.product_ids.length },
      error_details: { message: (error as Error).message },
      execution_time_ms: Date.now() - startTime,
    });

    return errorResponse('Internal error: ' + (error as Error).message, 500);
  }
}
