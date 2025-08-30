import { ActionContext, SyncProductRequest, errorResponse, corsHeaders } from '../types.ts';

export async function syncProduct(
  req: SyncProductRequest,
  { supabase, tenantId, jwt }: ActionContext
): Promise<Response> {
  if (!req.product_id) {
    return errorResponse('Product ID required', 400);
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', req.product_id)
    .single();

  if (productError || !product) {
    return errorResponse('Product not found', 404);
  }

  const startTime = Date.now();
  try {
    const { data: syncData, error: syncError } = await supabase.functions.invoke('ml-sync', {
      body: { action: 'sync_product', product_id: req.product_id },
      headers: { Authorization: `Bearer ${jwt}` }
    });

    const status =
      syncError || syncData?.error || !syncData?.success ? 'error' : 'success';

    await supabase.from('ml_sync_log').insert({
      tenant_id: tenantId,
      operation_type: 'sync_product',
      entity_type: 'product',
      entity_id: req.product_id,
      status,
      request_data: { product_name: product.name },
      response_data: syncData,
      error_details: syncError ? { message: syncError.message } : undefined,
      execution_time_ms: Date.now() - startTime
    });

    if (status === 'error') {
      return errorResponse(syncError?.message || syncData?.error || 'ML sync failed', 500);
    }

    return new Response(JSON.stringify(syncData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    await supabase.from('ml_sync_log').insert({
      tenant_id: tenantId,
      operation_type: 'sync_product',
      entity_type: 'product',
      entity_id: req.product_id,
      status: 'error',
      error_details: { message: (error as Error).message },
      execution_time_ms: Date.now() - startTime
    });

    return errorResponse('Internal error: ' + (error as Error).message, 500);
  }
}
