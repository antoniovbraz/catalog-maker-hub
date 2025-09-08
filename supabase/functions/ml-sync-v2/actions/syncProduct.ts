import { ActionContext, SyncProductRequest, errorResponse } from '../types.ts';
import { corsHeaders } from '../../shared/cors.ts';
import { isMLWriteEnabled } from '../../shared/write-guard.ts';

const DEFAULT_IMAGE_PLACEHOLDER =
  'https://http2.mlstatic.com/D_NQ_NP_2X_602223-MLA0000000000_000000-O.webp';

interface SyncResult {
  success: boolean;
  message: string;
  product?: Record<string, unknown>;
  sync_log?: Record<string, unknown>;
}

interface Product {
  category_id?: string;
  name?: string;
  description?: string;
  price?: number;
  ml_available_quantity?: number;
  brand?: string;
  model?: string;
}

interface Category {
  category_ml_id?: string;
  name?: string;
  category_ml_path?: string;
}

export async function syncProduct(
  req: SyncProductRequest,
  context: ActionContext
): Promise<Response> {
  if (!isMLWriteEnabled()) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'ML write operations disabled' 
      }),
      { 
        status: 423,
        headers: corsHeaders 
      }
    );
  }

  const { product_id, force_update } = req;
  const { supabase, tenantId, mlToken } = context;

  try {
    // Get product data
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('tenant_id', tenantId)
      .single();

    if (productError || !product) {
      throw new Error('Product not found');
    }

    // Check if already synced unless force update
    if (!force_update) {
      const { data: existingList } = await supabase
        .from('ml_product_mapping')
        .select('ml_item_id, last_sync_at')
        .eq('product_id', product_id)
        .eq('tenant_id', tenantId);

      const existingArray = existingList as Array<{ ml_item_id?: string; last_sync_at?: string }> | null;
      const existing = existingArray && existingArray.length > 0 ? existingArray[0] : null;

      if (existing?.ml_item_id) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Product already synced',
            ml_item_id: existing.ml_item_id
          }),
          { headers: corsHeaders }
        );
      }
    }

    // Get category data
    const productData = product as Product;
    let category: Category | null = null;
    if (productData.category_id) {
      const { data: categoryList } = await supabase
        .from('categories')
        .select('name, category_ml_id, category_ml_path')
        .eq('id', productData.category_id)
        .eq('tenant_id', tenantId);

      const categories = categoryList as Category[] | null;
      category = categories && categories.length > 0 ? categories[0] : null;
    }

    // Prepare ML listing data
    const listingData = await prepareMLListing(productData, category, supabase, tenantId);

    // Create or update ML listing
    const mlResponse = await createOrUpdateMLListing(
      listingData,
      mlToken,
      product_id,
      supabase,
      tenantId
    );

    // Log sync operation
      await logSyncOperation(
        product_id,
        tenantId,
        mlResponse.success,
        mlResponse.message,
        supabase
      );

    return new Response(
      JSON.stringify(mlResponse),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Sync error:', error);
    
    // Log failed operation
    await logSyncOperation(
      product_id,
      tenantId,
      false,
      (error as Error).message,
      supabase
    );

    return errorResponse('Sync failed: ' + (error as Error).message);
  }
}

async function prepareMLListing(
  product: Product,
  category: Category | null,
  supabase: ActionContext['supabase'],
  tenantId: string
) {
  // Get product images
  const { data: images } = await supabase
    .from('product_images')
    .select('image_url')
    .eq('product_id', product.id)
    .eq('tenant_id', tenantId)
    .order('created_at');

  const imageArray = images as Array<{ image_url: string }> | null;
  const pictures =
    imageArray && imageArray.length > 0
      ? imageArray.map((img) => ({ source: img.image_url }))
      : [{ source: DEFAULT_IMAGE_PLACEHOLDER }];

  const missingFields: string[] = [];
  
  if (!product.name) missingFields.push('title');
  if (!product.description) missingFields.push('description');
  if (!category?.category_ml_id) missingFields.push('category_id');
  if (!product.price || product.price <= 0) missingFields.push('price');

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Build attributes array
  const attributes = [];
  
  if (product.brand) {
    attributes.push({
      id: 'BRAND',
      value_name: product.brand
    });
  }
  
  if (product.model) {
    attributes.push({
      id: 'MODEL',
      value_name: product.model
    });
  }

  return {
    title: product.name,
    category_id: category.category_ml_id,
    price: product.price,
    currency_id: 'BRL',
    available_quantity: product.ml_available_quantity || 1,
    buying_mode: 'buy_it_now',
    condition: 'new',
    listing_type_id: 'gold_special',
    description: { plain_text: product.description },
    pictures,
    attributes,
    shipping: {
      mode: 'me2',
      free_shipping: false
    }
  };
}

async function createOrUpdateMLListing(
  listingData: Record<string, unknown>,
  mlToken: string,
  productId: string,
  supabase: ActionContext['supabase'],
  tenantId: string
): Promise<SyncResult> {
  try {
    const denoGlobal = globalThis as typeof globalThis & {
      Deno?: { env: { get(key: string): string | undefined } };
    };
    const nodeAccessToken =
      typeof process !== 'undefined' ? process.env?.ML_ACCESS_TOKEN : undefined;
    const accessToken =
      denoGlobal.Deno?.env.get('ML_ACCESS_TOKEN') ?? nodeAccessToken;
    
    const token = mlToken || accessToken;
    
    if (!token) {
      throw new Error('ML access token not available');
    }

    // Check if mapping exists
    const { data: mapping } = await supabase
      .from('ml_product_mapping')
      .select('ml_item_id')
      .eq('product_id', productId)
      .eq('tenant_id', tenantId)
      .single();

    let method = 'POST';
    let url = 'https://api.mercadolibre.com/items';

    if (mapping?.ml_item_id) {
      // Update existing item
      method = 'PUT';
      url = `https://api.mercadolibre.com/items/${mapping.ml_item_id}`;
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(listingData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`ML API Error: ${result.message || 'Unknown error'}`);
    }

    // Update or create mapping
    const mappingData = {
      product_id: productId,
      tenant_id: tenantId,
      ml_item_id: result.id,
      ml_listing_type: result.listing_type_id,
      ml_price: result.price,
      ml_available_quantity: result.available_quantity,
      ml_sold_quantity: result.sold_quantity || 0,
      ml_permalink: result.permalink,
      sync_status: 'synced',
      last_sync_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (mapping?.ml_item_id) {
      await supabase
        .from('ml_product_mapping')
        .update(mappingData)
        .eq('product_id', productId)
        .eq('tenant_id', tenantId);
    } else {
      await supabase
        .from('ml_product_mapping')
        .insert(mappingData);
    }

    return {
      success: true,
      message: mapping?.ml_item_id ? 'Item updated successfully' : 'Item created successfully',
      product: result
    };
  } catch (error) {
    console.error('ML API Error:', error);
    
    // Update mapping with error status
    await supabase
      .from('ml_product_mapping')
      .upsert({
        product_id: productId,
        tenant_id: tenantId,
        sync_status: 'error',
        error_message: (error as Error).message,
        last_sync_attempt: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    return {
      success: false,
      message: (error as Error).message
    };
  }
}

async function logSyncOperation(
  productId: string,
  tenantId: string,
  success: boolean,
  message: string,
  supabase: ActionContext['supabase']
) {
  try {
    await supabase
      .from('ml_sync_logs')
      .insert({
        tenant_id: tenantId,
        entity_type: 'product',
        entity_id: productId,
        operation: 'sync',
        status: success ? 'success' : 'error',
        message,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log sync operation:', error);
  }
}

// Additional export alias for backwards compatibility
export { syncProduct as syncSingleProduct };
