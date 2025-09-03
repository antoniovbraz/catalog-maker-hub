/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ActionContext,
  ResyncProductRequest,
  errorResponse,
  corsHeaders,
} from '../types.ts';
import { parseWeight, weightToGrams, parseCost } from './importFromML.ts';

export async function resyncProduct(
  req: ResyncProductRequest,
  { supabase, tenantId, mlToken }: ActionContext
): Promise<Response> {
  console.log('Re-syncing product:', req.productId);

  if (!req.productId) {
    return errorResponse('Product ID is required', 400);
  }

  try {
    const { data: productMapping, error: mappingError } = await supabase
      .from('ml_product_mapping')
      .select('*, products(*)')
      .eq('tenant_id', tenantId)
      .eq('product_id', req.productId)
      .single();

    if (mappingError || !productMapping?.ml_item_id) {
      console.error('Product mapping not found:', mappingError);
      return errorResponse('Produto não possui mapeamento ML válido', 404);
    }

    const itemResponse = await fetch(
      `https://api.mercadolibre.com/items/${productMapping.ml_item_id}`,
      { headers: { Authorization: `Bearer ${mlToken}` } }
    );

    if (!itemResponse.ok) {
      throw new Error(`ML API error: ${itemResponse.status}`);
    }

    const itemData = await itemResponse.json();
    console.log('Got item details for re-sync:', itemData.id, itemData.title);

    let description = '';
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

    let categoryData = null as any;
    let categoryPath = '';
    if (itemData.category_id) {
      try {
        const catResponse = await fetch(
          `https://api.mercadolibre.com/categories/${itemData.category_id}`,
          { headers: { Authorization: `Bearer ${mlToken}` } }
        );
        if (catResponse.ok) {
          categoryData = await catResponse.json();
          categoryPath = (categoryData.path_from_root || [])
            .map((c: any) => c.name)
            .join(' > ');
        }
      } catch (e) {
        console.warn('Could not fetch category:', e);
      }
    }

    const brand =
      itemData.attributes?.find((attr: any) => attr.id === 'BRAND')?.value_name || '';
    const model =
      itemData.attributes?.find((attr: any) => attr.id === 'MODEL')?.value_name || '';
    const warranty =
      itemData.attributes?.find((attr: any) => attr.id === 'WARRANTY')?.value_name || '';

    const dimensions = {
      length:
        itemData.attributes?.find((attr: any) => attr.id === 'LENGTH')?.value_name ||
        null,
      width:
        itemData.attributes?.find((attr: any) => attr.id === 'WIDTH')?.value_name ||
        null,
      height:
        itemData.attributes?.find((attr: any) => attr.id === 'HEIGHT')?.value_name ||
        null,
    } as Record<string, any>;

    const weightAttr = itemData.attributes?.find(
      (attr: any) => attr.id === 'WEIGHT'
    );
    let weight = 0;
    if (weightAttr?.value_name) {
      const { value, unit } = parseWeight(weightAttr.value_name);
      weight = weightToGrams(value, unit);
    }
    const variation =
      productMapping.ml_variation_id
        ? itemData.variations?.find(
            // Normalize IDs as Supabase returns strings and ML API returns numbers
            (v: any) => String(v.id) === String(productMapping.ml_variation_id)
          )
        : itemData.variations?.[0];
    const mlSku =
      itemData.seller_custom_field ||
      itemData.attributes?.find((attr: any) => attr.id === 'SELLER_SKU')
        ?.value_name ||
      variation?.seller_custom_field ||
      variation?.seller_sku ||
      variation?.attributes?.find((attr: any) => attr.id === 'SELLER_SKU')
        ?.value_name ||
      variation?.id ||
      null;
    const skuSource = mlSku ? 'mercado_livre' : 'none';

    const cost = parseCost(itemData.sale_terms || []);

    const shouldUpdateName = !productMapping.products?.name;
    const localCost = productMapping.products?.cost_unit;
    const shouldUpdateCost =
      localCost === null || localCost === undefined || Number(localCost) <= 0;
    const hasPriceField =
      productMapping.products &&
      Object.prototype.hasOwnProperty.call(productMapping.products, 'price');
    const localPrice = (productMapping.products as any)?.price;
    const shouldUpdatePrice =
      hasPriceField && (!localPrice || Number(localPrice) <= 0);

    const updateData: Record<string, any> = {
      description: description,
      sku: mlSku,
      sku_source: skuSource,
      brand: brand,
      model: model,
      warranty: warranty,
      weight: weight,
      dimensions: dimensions,
      ml_attributes: itemData.attributes || {},
      ml_seller_sku: mlSku,
      ml_available_quantity: itemData.available_quantity || 0,
      ml_sold_quantity: itemData.sold_quantity || 0,
      ml_variation_id: variation ? String(variation.id) : null,
      ml_pictures: itemData.pictures || [],
      updated_at: new Date().toISOString(),
      updated_from_ml_at: new Date().toISOString(),
    };

    if (categoryData) {
      updateData.category_ml_id = categoryData.id;
      updateData.category_ml_path = categoryPath;
    }

    if (shouldUpdateName) updateData.name = itemData.title;
    if (shouldUpdateCost) updateData.cost_unit = cost;
    if (shouldUpdatePrice) updateData.price = itemData.price;

    const { error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', req.productId)
      .eq('tenant_id', tenantId);

    if (updateError) {
      console.error('Error updating product:', updateError);
      throw new Error('Erro ao atualizar produto');
    }

    if (categoryData) {
      await supabase
        .from('ml_product_mapping')
        .update({
          ml_category_id: categoryData.id,
          last_sync_at: new Date().toISOString(),
          sync_status: 'synced',
          error_message: null,
        })
        .eq('product_id', req.productId)
        .eq('tenant_id', tenantId);

      await supabase
        .from('ml_categories')
        .upsert(
          {
            tenant_id: tenantId,
            ml_category_id: categoryData.id,
            ml_category_name: categoryData.name,
            ml_path_from_root: categoryData.path_from_root || [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'tenant_id,ml_category_id' }
        );
    }

    if (itemData.pictures?.length > 0) {
      for (let i = 0; i < Math.min(itemData.pictures.length, 10); i++) {
        const picture = itemData.pictures[i];
        await supabase
          .from('product_images')
          .upsert(
            {
              tenant_id: tenantId,
              product_id: req.productId,
              image_url: picture.url || picture.secure_url,
              sort_order: i,
              image_type: 'ml_sync',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'tenant_id,product_id,image_url' }
          );
      }
    }

    await supabase
      .from('ml_sync_log')
      .insert({
        tenant_id: tenantId,
        operation_type: 'resync_product',
        entity_type: 'product',
        entity_id: req.productId,
        ml_entity_id: itemData.id,
        status: 'success',
        request_data: { productId: req.productId },
        response_data: {
          title: itemData.title,
          category: categoryData?.name,
          attributes_count: itemData.attributes?.length || 0,
          pictures_count: itemData.pictures?.length || 0,
        },
      });

    console.log('Product re-sync completed successfully');
    const updatedFields = [
      'description',
      'sku',
      'brand',
      'model',
      'warranty',
      'dimensions',
      'attributes',
    ];
    if (shouldUpdateName) updatedFields.push('name');
    if (shouldUpdateCost) updatedFields.push('cost_unit');
    if (shouldUpdatePrice) updatedFields.push('price');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Produto re-sincronizado com sucesso',
        data: {
          title: itemData.title,
          category: categoryData?.name,
          updated_fields: updatedFields,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in resync_product:', error);

    await supabase
      .from('ml_sync_log')
      .insert({
        tenant_id: tenantId,
        operation_type: 'resync_product',
        entity_type: 'product',
        entity_id: req.productId,
        status: 'error',
        error_details: { message: (error as Error).message, stack: (error as Error).stack },
      });

    return new Response(
      JSON.stringify({ error: 'Erro na re-sincronização: ' + (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}
