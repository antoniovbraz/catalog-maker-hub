import { ActionContext, SyncBatchRequest, errorResponse, corsHeaders } from '../types.ts';

export async function syncBatch(
  req: SyncBatchRequest,
  { supabase, tenantId, jwt }: ActionContext
): Promise<Response> {
  if (!req.product_ids || !Array.isArray(req.product_ids)) {
    return errorResponse('Product IDs array required', 400);
  }

  const startTime = Date.now();
  try {
    const { data: syncData, error: syncError } = await supabase.functions.invoke('ml-sync', {
      body: { action: 'sync_batch', product_ids: req.product_ids },
      headers: { Authorization: `Bearer ${jwt}` }
    });

    const status = syncError || !syncData || syncData?.error ? 'error' : 'success';

    await supabase.from('ml_sync_log').insert({
      tenant_id: tenantId,
      operation_type: 'sync_batch',
      entity_type: 'batch',
      status,
      request_data: { product_count: req.product_ids.length },
      response_data: syncData,
      error_details: syncError ? { message: syncError.message } : undefined,
      execution_time_ms: Date.now() - startTime
    });

    if (status === 'error') {
      return errorResponse(syncError?.message || syncData?.error || 'ML batch sync failed', 500);
    }

    return new Response(JSON.stringify(syncData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    await supabase.from('ml_sync_log').insert({
      tenant_id: tenantId,
      operation_type: 'sync_batch',
      entity_type: 'batch',
      status: 'error',
      request_data: { product_count: req.product_ids.length },
      error_details: { message: (error as Error).message },
      execution_time_ms: Date.now() - startTime
    });

    return errorResponse('Internal error: ' + (error as Error).message, 500);
  }
}
