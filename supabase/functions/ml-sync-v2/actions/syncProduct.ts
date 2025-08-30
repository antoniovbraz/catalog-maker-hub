import { ActionContext, SyncProductRequest, errorResponse, corsHeaders } from '../types.ts';

export async function syncProduct(
  req: SyncProductRequest,
  { supabase, tenantId }: ActionContext
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

  await supabase
    .from('ml_sync_log')
    .insert({
      tenant_id: tenantId,
      operation_type: 'sync_product',
      entity_type: 'product',
      entity_id: req.product_id,
      status: 'success',
      request_data: { product_name: product.name },
    });

  return new Response(
    JSON.stringify({ success: true, message: 'Product sync initiated' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
