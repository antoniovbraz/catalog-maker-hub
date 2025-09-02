import { ActionContext, GetProductsRequest, errorResponse, corsHeaders } from '../types.ts';

interface ProductMapping {
  products: {
    id: string;
    name: string;
    sku: string;
    source: string;
  };
  sync_status: string | null;
  ml_item_id: string | null;
  last_sync_at: string | null;
  ml_title: string | null;
  ml_permalink: string | null;
}

export async function getProducts(
  _req: GetProductsRequest,
  { supabase, tenantId }: ActionContext
): Promise<Response> {
  const { data: mlProducts, error: mlProductsError } = await supabase
    .from('ml_product_mapping')
    .select(`
      id,
      product_id,
      ml_item_id,
      sync_status,
      last_sync_at,
      ml_title,
      ml_permalink,
      products!inner (
        id,
        name,
        sku,
        source
      )
    `)
    .eq('tenant_id', tenantId);

  if (mlProductsError) {
    console.error('ML Products query error:', mlProductsError);
    return errorResponse('Failed to get ML products', 500);
  }

  const transformedProducts = (mlProducts || []).map((mapping: ProductMapping) => ({
    id: mapping.products.id,
    name: mapping.products.name,
    sku: mapping.products.sku,
    source: mapping.products.source,
    sync_status: mapping.sync_status || 'not_synced',
    ml_item_id: mapping.ml_item_id,
    last_sync_at: mapping.last_sync_at,
    ml_title: mapping.ml_title,
    ml_permalink: mapping.ml_permalink,
  }));

  return new Response(
    JSON.stringify({
      success: true,
      products: transformedProducts,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
