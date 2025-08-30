import { ActionContext, LinkProductRequest, errorResponse, corsHeaders } from '../types.ts';

export async function linkProduct(
  req: LinkProductRequest,
  { supabase, tenantId }: ActionContext
): Promise<Response> {
  if (!req.product_id || !req.ml_item_id) {
    return errorResponse('Product ID and ML Item ID required', 400);
  }

  const { error: mappingError } = await supabase
    .from('ml_product_mapping')
    .upsert(
      {
        tenant_id: tenantId,
        product_id: req.product_id,
        ml_item_id: req.ml_item_id,
        sync_status: 'linked',
      },
      {
        onConflict: 'tenant_id, product_id',
      }
    );

  if (mappingError) {
    console.error('Mapping error:', mappingError);
    return errorResponse('Failed to link product', 500);
  }

  await supabase
    .from('ml_sync_log')
    .insert({
      tenant_id: tenantId,
      operation_type: 'link_product',
      entity_type: 'mapping',
      entity_id: req.product_id,
      status: 'success',
      request_data: { ml_item_id: req.ml_item_id },
    });

  return new Response(
    JSON.stringify({ success: true, message: 'Product linked successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
