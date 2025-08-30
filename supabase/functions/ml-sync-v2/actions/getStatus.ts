import { ActionContext, GetStatusRequest, errorResponse, corsHeaders } from '../types.ts';

export async function getStatus(
  _req: GetStatusRequest,
  { supabase, tenantId }: ActionContext
): Promise<Response> {
  const { data: mappings, error: mappingError } = await supabase
    .from('ml_product_mapping')
    .select('*')
    .eq('tenant_id', tenantId);

  if (mappingError) {
    console.error('Mapping query error:', mappingError);
    return errorResponse('Failed to get sync status', 500);
  }

  const totalProducts = mappings?.length || 0;
  const syncedProducts = mappings?.filter((m: any) => m.ml_item_id).length || 0;
  const pendingProducts = totalProducts - syncedProducts;

  return new Response(
    JSON.stringify({
      total_products: totalProducts,
      synced_products: syncedProducts,
      pending_products: pendingProducts,
      last_sync: mappings?.[0]?.updated_at || null,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
