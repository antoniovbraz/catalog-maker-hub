import { ActionContext, SyncProductRequest, errorResponse, corsHeaders } from '../types.ts';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DEFAULT_IMAGE_PLACEHOLDER =
  'https://http2.mlstatic.com/D_NQ_NP_2X_602223-MLA0000000000_000000-O.webp';

interface SyncResult {
  success: boolean;
  ml_item_id?: string;
  ml_permalink?: string;
  operation?: 'updated' | 'created';
  error?: string;
  status?: number;
}

export async function syncSingleProduct(
  supabase: SupabaseClient,
  tenantId: string,
  productId: string,
  mlToken: string,
  forceUpdate = false
): Promise<SyncResult> {
  const startTime = Date.now();

  try {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        categories(id, name)
      `)
      .eq('id', productId)
      .eq('tenant_id', tenantId)
      .single();

    if (productError || !product) {
      throw new Error('Product not found');
    }

    const { data: existingMapping, error: mappingError } = await supabase
      .from('ml_product_mapping')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('product_id', productId)
      .maybeSingle();

    if (mappingError) {
      throw new Error('Failed to get product mapping');
    }

    await supabase
      .from('ml_product_mapping')
      .upsert(
        {
          tenant_id: tenantId,
          product_id: productId,
          sync_status: 'syncing',
          last_sync_at: new Date().toISOString(),
        },
        {
          onConflict: 'tenant_id,product_id',
        }
      );

    let mlCategoryId = 'MLB1051';
    if (product.categories) {
      const { data: categoryMapping } = await supabase
        .from('ml_category_mapping')
        .select('ml_category_id')
        .eq('tenant_id', tenantId)
        .eq('category_id', product.categories.id)
        .single();

      if (categoryMapping) {
        mlCategoryId = categoryMapping.ml_category_id;
      }
    }
    let { data: images } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('tenant_id', tenantId)
      .eq('product_id', productId)
      .order('sort_order');

    const initialMissing: string[] = [];
    if (!product.description) initialMissing.push('description');
    if (!product.sku) initialMissing.push('sku');
    if (
      product.cost_unit === null ||
      product.cost_unit === undefined
    )
      initialMissing.push('cost_unit');
    if (!images || images.length === 0) initialMissing.push('images');

    if (product.source === 'mercado_livre' && initialMissing.length > 0) {
      try {
        if (existingMapping?.ml_item_id) {
          const itemResponse = await fetch(
            `https://api.mercadolibre.com/items/${existingMapping.ml_item_id}`,
            { headers: { Authorization: `Bearer ${mlToken}` } }
          );
          if (itemResponse.ok) {
            const itemData = await itemResponse.json();
            let description = product.description;
            if (!product.description) {
              try {
                const descResponse = await fetch(
                  `https://api.mercadolibre.com/items/${itemData.id}/description`,
                  { headers: { Authorization: `Bearer ${mlToken}` } }
                );
                if (descResponse.ok) {
                  const descData = await descResponse.json();
                  description = descData.plain_text || '';
                }
              } catch (e) {
                console.warn('Could not fetch description:', e);
              }
            }

            let sku = product.sku;
            let skuSource = product.sku_source;
            if (!sku) {
              const mlSku =
                itemData.seller_custom_field ||
                itemData.attributes?.find((attr) => attr.id === 'SELLER_SKU')?.value_name ||
                null;
              sku = mlSku;
              skuSource = mlSku ? 'mercado_livre' : 'none';
            }

            const costUnit =
              product.cost_unit === null || product.cost_unit === undefined
                ? itemData.price
                : product.cost_unit;

            const updates: Record<string, unknown> = {
              updated_at: new Date().toISOString(),
            };
            if (!product.description) updates.description = description;
            if (!product.sku) {
              updates.sku = sku;
              updates.sku_source = skuSource;
              updates.ml_seller_sku = sku;
              updates.updated_from_ml_at = new Date().toISOString();
            }
            if (product.cost_unit === null || product.cost_unit === undefined)
              updates.cost_unit = costUnit;

            if (Object.keys(updates).length > 1) {
              await supabase
                .from('products')
                .update(updates)
                .eq('id', productId)
                .eq('tenant_id', tenantId);

              product.description = description;
              product.sku = sku;
              product.cost_unit = costUnit;
            }

            if ((!images || images.length === 0) && itemData.pictures?.length > 0) {
              for (let i = 0; i < Math.min(itemData.pictures.length, 10); i++) {
                const picture = itemData.pictures[i];
                await supabase
                  .from('product_images')
                  .upsert(
                    {
                      tenant_id: tenantId,
                      product_id: productId,
                      image_url: picture.url || picture.secure_url,
                      sort_order: i,
                      image_type: 'ml_sync',
                      updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'tenant_id,product_id,image_url' }
                  );
              }

              const refreshed = await supabase
                .from('product_images')
                .select('image_url')
                .eq('tenant_id', tenantId)
                .eq('product_id', productId)
                .order('sort_order');
              images = refreshed.data || images;
            }
          }
        }
      } catch (e) {
        console.warn('Auto-import failed:', e);
      }
    }

    const pictures =
      images && images.length > 0
        ? images.map((img) => ({ source: img.image_url }))
        : [{ source: DEFAULT_IMAGE_PLACEHOLDER }];

    const missingFields: string[] = [];
    if (!product.name) missingFields.push('name');
    if (!product.sku) missingFields.push('sku');
    if (!product.description) missingFields.push('description');
    if (
      product.cost_unit === null ||
      product.cost_unit === undefined
    )
      missingFields.push('cost_unit');
    if (!images || images.length === 0) missingFields.push('images');

    if (missingFields.length > 0) {
      const message = `Missing required fields: ${missingFields.join(', ')}`;

      await supabase.from('ml_sync_log').insert({
        tenant_id: tenantId,
        operation_type: 'sync_product',
        entity_type: 'product',
        entity_id: productId,
        status: 'error',
        error_details: { message, missing_fields: missingFields },
        execution_time_ms: Date.now() - startTime,
      });

      await supabase
        .from('ml_product_mapping')
        .upsert(
          {
            tenant_id: tenantId,
            product_id: productId,
            sync_status: 'error',
            error_message: message,
            last_sync_at: new Date().toISOString(),
          },
          {
            onConflict: 'tenant_id,product_id',
          }
        );

      return { success: false, error: message, status: 400 };
    }

    const margin = parseFloat(Deno.env.get('ML_PRICE_MARGIN') || '1');
    const { price: productPriceField, ml_price: mlPriceField } =
      product as { price?: string | number | null; ml_price?: string | number | null };
    const productPrice = productPriceField ?? mlPriceField;
    const price = productPrice
      ? parseFloat(String(productPrice))
      : parseFloat(String(product.cost_unit)) * margin;

    const mlItemData = {
      title: product.name,
      category_id: mlCategoryId,
      price,
      currency_id: 'BRL',
      available_quantity: 999,
      buying_mode: 'buy_it_now',
      listing_type_id: 'gold_special',
      condition: 'new',
      description: {
        plain_text: product.description || `Produto ${product.name}`,
      },
      pictures,
    };

    let mlResponse: Response;
    let isUpdate = false;

    if (existingMapping?.ml_item_id && !forceUpdate) {
      isUpdate = true;
      mlResponse = await fetch(
        `https://api.mercadolibre.com/items/${existingMapping.ml_item_id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${mlToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mlItemData),
        }
      );
    } else {
      mlResponse = await fetch('https://api.mercadolibre.com/items', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mlToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mlItemData),
      });
    }

    if (!mlResponse.ok) {
      const errorData = await mlResponse.json();
      console.error('ML API Error:', errorData);

      await supabase
        .from('ml_product_mapping')
        .upsert(
          {
            tenant_id: tenantId,
            product_id: productId,
            sync_status: 'error',
            error_message: JSON.stringify(errorData),
            last_sync_at: new Date().toISOString(),
          },
          { onConflict: 'tenant_id,product_id' }
        );

      throw new Error(
        `Mercado Livre API error: ${errorData.message || 'Unknown error'}`
      );
    }

    const mlItem = await mlResponse.json();

    const mappingUpdate = {
      tenant_id: tenantId,
      product_id: productId,
      ml_item_id: mlItem.id,
      sync_status: 'synced',
      error_message: null,
      ml_permalink: mlItem.permalink,
      ml_title: mlItem.title,
      ml_price: mlItem.price,
      ml_category_id: mlItem.category_id,
      ml_listing_type: mlItem.listing_type_id,
      ml_condition: mlItem.condition,
      last_sync_at: new Date().toISOString(),
    };

    await supabase
      .from('ml_product_mapping')
      .upsert(mappingUpdate, { onConflict: 'tenant_id,product_id' });

    await supabase.from('ml_sync_log').insert({
      tenant_id: tenantId,
      operation_type: isUpdate ? 'update_product' : 'create_product',
      entity_type: 'product',
      entity_id: productId,
      ml_entity_id: mlItem.id,
      status: 'success',
      request_data: mlItemData,
      response_data: mlItem,
      execution_time_ms: Date.now() - startTime,
    });

    return {
      success: true,
      ml_item_id: mlItem.id,
      ml_permalink: mlItem.permalink,
      operation: isUpdate ? 'updated' : 'created',
    };
  } catch (error) {
    await supabase.from('ml_sync_log').insert({
      tenant_id: tenantId,
      operation_type: 'sync_product',
      entity_type: 'product',
      entity_id: productId,
      status: 'error',
      error_details: { message: (error as Error).message },
      execution_time_ms: Date.now() - startTime,
    });

    throw error;
  }
}

export async function syncProduct(
  req: SyncProductRequest,
  { supabase, tenantId, mlToken }: ActionContext
): Promise<Response> {
  if (!req.product_id) {
    return errorResponse('Product ID required', 400);
  }

  try {
    const result = await syncSingleProduct(
      supabase,
      tenantId,
      req.product_id,
      mlToken,
      req.force_update
    );

    if (!result.success) {
      return errorResponse(
        result.error || 'ML sync failed',
        result.status || 500
      );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return errorResponse('Internal error: ' + (error as Error).message, 500);
  }
}

