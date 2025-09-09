import { ActionContext, ResyncProductRequest } from '../types.ts';
import { fetchWithRetry } from '../../shared/fetchWithRetry.ts';

interface ProductMapping {
  ml_item_id: string;
}

// Simplified resync function for compatibility
export async function resyncProduct(
  req: ResyncProductRequest,
  { supabase, tenantId, mlToken }: ActionContext
): Promise<Response> {
  console.log('Starting product resync for:', req.productId);
  
  try {
    // Get product mapping
    const { data } = await supabase
      .from('ml_product_mapping')
      .select('ml_item_id')
      .eq('tenant_id', tenantId)
      .eq('product_id', req.productId)
      .single();

    const productMapping = data as ProductMapping | null;

    if (!productMapping) {
      throw new Error('Product mapping not found');
    }

    // Get item details from ML
    const itemResponse = await fetchWithRetry(`https://api.mercadolibre.com/items/${productMapping.ml_item_id}`, {
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
    await supabase.from('ml_product_mapping').upsert({
      product_id: req.productId,
      tenant_id: tenantId,
      ml_title: itemData.title,
      ml_price: itemData.price,
      sync_status: 'synced',
      last_sync_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id,product_id' });

    return new Response(JSON.stringify({
      success: true,
      product_id: req.productId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Resync failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    return new Response(JSON.stringify({
      success: false,
      error: message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}