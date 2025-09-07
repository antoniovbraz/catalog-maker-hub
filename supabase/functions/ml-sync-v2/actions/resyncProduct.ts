import { ActionContext, ResyncProductRequest } from '../types.ts';

// Simplified resync function for compatibility
export async function resyncProduct(
  req: ResyncProductRequest,
  { supabase, tenantId, mlToken }: ActionContext
): Promise<Response> {
  console.log('Starting product resync for:', req.productId);
  
  try {
    // Get product mapping
    const { data: productMapping } = await supabase
      .from('ml_product_mapping')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('product_id', req.productId)
      .single();

    if (!productMapping) {
      throw new Error('Product mapping not found');
    }

    // Get item details from ML
    const itemResponse = await fetch(`https://api.mercadolibre.com/items/${productMapping.ml_item_id}`, {
      headers: { 'Authorization': `Bearer ${mlToken}` }
    });
    
    if (!itemResponse.ok) {
      throw new Error(`Failed to fetch ML item: ${itemResponse.status}`);
    }
    
    const itemData = await itemResponse.json();
    
    // Update product with ML data
    await supabase.from('products').update({
      name: itemData.title,
      cost_unit: itemData.price || 0,
      updated_from_ml_at: new Date().toISOString(),
    }).eq('id', req.productId);

    // Update mapping
    await supabase.from('ml_product_mapping').update({
      ml_title: itemData.title,
      ml_price: itemData.price,
      sync_status: 'synced',
      last_sync_at: new Date().toISOString(),
    }).eq('product_id', req.productId);

    return new Response(JSON.stringify({
      success: true,
      product_id: req.productId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Resync failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}