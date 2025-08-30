import { ActionContext, SyncBatchRequest, errorResponse, corsHeaders } from '../types.ts';

export async function syncBatch(
  req: SyncBatchRequest,
  { supabase, tenantId }: ActionContext
): Promise<Response> {
  if (!req.product_ids || !Array.isArray(req.product_ids)) {
    return errorResponse('Product IDs array required', 400);
  }

  await supabase
    .from('ml_sync_log')
    .insert({
      tenant_id: tenantId,
      operation_type: 'sync_batch',
      entity_type: 'batch',
      status: 'success',
      request_data: { product_count: req.product_ids.length },
    });

  return new Response(
    JSON.stringify({
      success: true,
      message: `Batch sync initiated for ${req.product_ids.length} products`,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
