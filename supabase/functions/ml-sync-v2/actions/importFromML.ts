import {
  ActionContext,
  ImportFromMLRequest,
  errorResponse,
  corsHeaders,
} from '../types.ts';
import { resyncProduct } from './resyncProduct.ts';

interface MLAttribute {
  id: string;
  value_name?: string;
}

export function parseWeight(valueName: string = ''): { value: number; unit: string } {
  const normalized = valueName.replace(',', '.').trim();
  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]*)$/);
  const value = match ? parseFloat(match[1]) : 0;
  const unit = match && match[2] ? match[2].toLowerCase() : 'g';
  return { value, unit };
}

export function weightToGrams(value: number, unit: string): number {
  switch (unit) {
    case 'kg':
    case 'kgs':
    case 'kilogram':
    case 'kilograms':
      return value * 1000;
    case 'g':
    case 'gram':
    case 'grams':
      return value;
    case 'lb':
    case 'lbs':
    case 'pound':
    case 'pounds':
    case 'libra':
    case 'libras':
      return value * 453.592;
    case 'oz':
    case 'ounce':
    case 'ounces':
      return value * 28.3495;
    default:
      return value;
  }
}

export function parseCost(
  saleTerms: Array<{ id: string; value_name?: string }> = []
): number | null {
  const costTerm = saleTerms.find((term) =>
    term.id?.toLowerCase().includes('cost')
  );
  if (!costTerm?.value_name) return null;
  const numeric = costTerm.value_name
    .replace(/[^0-9.,-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const value = parseFloat(numeric);
  return isNaN(value) ? null : value;
}

export async function importFromML(
  _req: ImportFromMLRequest,
  { supabase, tenantId, authToken, mlToken }: ActionContext
): Promise<Response> {
  console.log('Starting ML import for tenant:', tenantId);
  let offset = 0;
  let totalItems = 0;
  let createdCount = 0;
  let updatedCount = 0;
  let processedCount = 0;
  const errors: string[] = [];

  do {
    const itemsResponse = await fetch(
      `https://api.mercadolibre.com/users/${authToken.user_id_ml}/items/search?offset=${offset}`,
      {
        headers: {
          Authorization: `Bearer ${authToken.access_token}`,
        },
      }
    );

    if (!itemsResponse.ok) {
      const errorText = await itemsResponse.text();
      console.error('ML Items Error:', errorText);
      return errorResponse('Failed to fetch ML items', 500);
    }

    const itemsData = await itemsResponse.json();
    const itemIds = itemsData.results || [];
    const { total, offset: currentOffset, limit } = itemsData.paging || {
      total: itemIds.length,
      offset,
      limit: itemIds.length,
    };

    if (offset === 0) {
      totalItems = total;
      console.log(`Found ${totalItems} ML items to import`);
    }

    for (const itemId of itemIds) {
      try {
        console.log(`Processing item: ${itemId}`);

        const { data: existingMapping } = await supabase
          .from('ml_product_mapping')
          .select('product_id')
          .eq('tenant_id', tenantId)
          .eq('ml_item_id', itemId)
          .maybeSingle();

        if ((existingMapping as any)?.product_id) {
          try {
            const resyncResponse = await resyncProduct(
              { action: 'resync_product', productId: (existingMapping as any).product_id },
              { supabase, tenantId, mlToken, authToken: {}, mlClientId: '', jwt: '' }
            );

            if (resyncResponse.ok) {
              updatedCount++;
            } else {
              const text = await resyncResponse.text();
              errors.push(`Failed to resync item ${itemId}: ${text}`);
            }
          } catch (err) {
            errors.push(`Error resyncing item ${itemId}: ${(err as Error).message}`);
          } finally {
            processedCount++;
          }
          continue;
        }

        const itemDetailResponse = await fetch(
          `https://api.mercadolibre.com/items/${itemId}`,
          {
            headers: { Authorization: `Bearer ${authToken.access_token}` },
          }
        );

        if (!itemDetailResponse.ok) {
          console.error(`Failed to get details for item ${itemId}`);
          errors.push(`Failed to get details for item ${itemId}`);
          continue;
        }

        const itemDetail = await itemDetailResponse.json();
        console.log(`Got details for item ${itemId}:`, itemDetail.title);

        let fullDescription = '';
        try {
          const descResponse = await fetch(
            `https://api.mercadolibre.com/items/${itemId}/description`,
            { headers: { Authorization: `Bearer ${authToken.access_token}` } }
          );
          if (descResponse.ok) {
            const descData = await descResponse.json();
            fullDescription = descData.plain_text || descData.text || '';
          }
        } catch (error) {
          console.log(`Could not fetch description for ${itemId}:`, error);
        }

        let categoryName = '';
        let categoryPathArray: Array<{ id: string; name: string }> = [];
        let categoryPath = '';
        if (itemDetail.category_id) {
          try {
            const catResponse = await fetch(
              `https://api.mercadolibre.com/categories/${itemDetail.category_id}`,
              { headers: { Authorization: `Bearer ${authToken.access_token}` } }
            );
            if (catResponse.ok) {
              const catData = await catResponse.json();
              categoryName = catData.name;
              categoryPathArray = catData.path_from_root || [];
              categoryPath = categoryPathArray
                .map((c: { name: string }) => c.name)
                .join(' > ');
            }
          } catch (error) {
            console.log(
              `Could not fetch category for ${itemDetail.category_id}:`,
              error
            );
          }
        }

        let categoryId: string | null = null;
        if (itemDetail.category_id && categoryName) {
          const { data: mlCategory, error: mlCatError } = await supabase
            .from('ml_categories')
            .upsert({
              tenant_id: tenantId,
              ml_category_id: itemDetail.category_id,
              ml_category_name: categoryName,
              ml_path_from_root: categoryPathArray,
              auto_mapped: true,
            })
            .select()
            .single();

          if (!mlCatError && mlCategory) {
            const localCategory = await supabase
              .from('categories')
              .select('id')
              .eq('tenant_id', tenantId)
              .ilike('name', `%${categoryName}%`)
              .maybeSingle();

            if (!localCategory.data) {
              const { data: newCategory } = await supabase
                .from('categories')
                .insert({
                  tenant_id: tenantId,
                  name: categoryName,
                  description: `Categoria auto-criada do ML: ${itemDetail.category_id}`,
                })
                .select()
                .single();

              if (newCategory) {
                categoryId = (newCategory as any).id;
                await supabase
                  .from('ml_categories')
                  .update({ local_category_id: categoryId })
                  .eq('id', (mlCategory as any).id);
              }
            } else {
              categoryId = (localCategory.data as any).id;
              await supabase
                .from('ml_categories')
                .update({ local_category_id: categoryId })
                .eq('id', (mlCategory as any).id);
            }
          }
        }

        const attributes: MLAttribute[] = itemDetail.attributes || [];
        const brand =
          attributes.find((attr) => attr.id === 'BRAND')?.value_name || '';
        const model =
          attributes.find((attr) => attr.id === 'MODEL')?.value_name || '';

        const dimensions: Record<string, string> = {};
        const width = attributes.find((attr) => attr.id === 'WIDTH')?.value_name;
        const height = attributes.find((attr) => attr.id === 'HEIGHT')?.value_name;
        const depth = attributes.find((attr) => attr.id === 'DEPTH')?.value_name;
        const length = attributes.find((attr) => attr.id === 'LENGTH')?.value_name;
        if (width) dimensions.width = width;
        if (height) dimensions.height = height;
        if (depth) dimensions.depth = depth;
        if (length) dimensions.length = length;

        const weightAttr = attributes.find((attr) => attr.id === 'WEIGHT');
        let weight = 0;
        if (weightAttr?.value_name) {
          const { value, unit } = parseWeight(weightAttr.value_name);
          weight = weightToGrams(value, unit);
        }

        const warrantyAttr = attributes.find((attr) => attr.id === 'WARRANTY');
        const warranty = warrantyAttr ? warrantyAttr.value_name : '';

        // Capturar SKU fornecido pelo ML
        const mlSku =
          itemDetail.seller_sku ||
          itemDetail.seller_custom_field ||
          attributes.find((attr) => attr.id === 'SELLER_SKU')?.value_name ||
          null;
        const skuSource = mlSku ? 'mercado_livre' : 'none';

        // Cost is parsed from ML sale terms when provided; otherwise use zero
        // The previous heuristic of price * 0.7 has been removed to prevent mispricing
        const cost = parseCost(itemDetail.sale_terms || []) ?? 0;

        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .upsert(
            {
              tenant_id: tenantId,
              name: itemDetail.title,
              description: fullDescription || itemDetail.description || '',
              sku: mlSku,
              sku_source: skuSource,
              category_id: categoryId,
              cost_unit: cost,
              packaging_cost: 0,
              tax_rate: 0,
              source: 'mercado_livre',
              ml_stock_quantity: itemDetail.available_quantity || 0,
              ml_attributes: attributes,
              dimensions: dimensions,
              weight: weight,
              warranty: warranty,
              brand: brand,
              model: model,
              ml_seller_sku: mlSku,
              ml_available_quantity: itemDetail.available_quantity || 0,
              ml_sold_quantity: itemDetail.sold_quantity || 0,
              ml_variation_id: itemDetail.variation_id || null,
              ml_variations: itemDetail.variations || [],
              ml_pictures: itemDetail.pictures || [],
              ml_item_id: itemId,
              category_ml_id: itemDetail.category_id,
              category_ml_path: categoryPath,
              updated_from_ml_at: new Date().toISOString(),
            },
            { onConflict: 'tenant_id, ml_item_id' }
          )
          .select()
          .single();

      if (productError) {
        console.error(`Failed to create product for item ${itemId}:`, productError);
        errors.push(
          `Failed to create product for item ${itemId}: ${productError.message}`
        );
        continue;
      }

      console.log(`Created product ${(newProduct as any).id} for ML item ${itemId}`);

      const { error: mappingError } = await supabase
        .from('ml_product_mapping')
        .upsert(
          {
            tenant_id: tenantId,
            product_id: (newProduct as any).id,
            ml_item_id: itemId,
            ml_title: itemDetail.title,
            ml_permalink: itemDetail.permalink,
            ml_price: itemDetail.price,
            ml_currency_id: itemDetail.currency_id || 'BRL',
            ml_listing_type: itemDetail.listing_type_id || 'gold_special',
            ml_condition: itemDetail.condition || 'new',
            ml_category_id: itemDetail.category_id,
            sync_status: 'synced',
            sync_direction: 'from_ml',
            last_sync_at: new Date().toISOString(),
          },
          { onConflict: 'tenant_id, ml_item_id' }
        );

      if (mappingError) {
        console.error(
          `Failed to create mapping for item ${itemId}:`,
          mappingError
        );
        errors.push(
          `Failed to create mapping for item ${itemId}: ${mappingError.message}`
        );
        continue;
      }

      console.log(`Created mapping for ML item ${itemId}`);

      if (itemDetail.pictures && itemDetail.pictures.length > 0) {
        try {
          const imageInserts = itemDetail.pictures.map(
            (picture: { secure_url?: string; url?: string }, index: number) => ({
              tenant_id: tenantId,
              product_id: (newProduct as any).id,
              image_url: picture.secure_url || picture.url,
              sort_order: index,
              image_type: 'product',
            })
          );

          const { error: imageError } = await supabase
            .from('product_images')
            .insert(imageInserts);

          if (imageError) {
            console.error(`Failed to save images for item ${itemId}:`, imageError);
          } else {
            console.log(
              `Saved ${itemDetail.pictures.length} images for item ${itemId}`
            );
          }
        } catch (imageError) {
          console.error(`Error saving images for item ${itemId}:`, imageError);
        }
      }

      createdCount++;
    } catch (error) {
      console.error(`Error processing item ${itemId}:`, error);
      errors.push(`Error processing item ${itemId}: ${(error as Error).message}`);
    } finally {
      processedCount++;
    }
    }

    offset = currentOffset + limit;
  } while (offset < totalItems);

  await supabase
    .from('ml_sync_log')
    .insert({
      tenant_id: tenantId,
      operation_type: 'import_from_ml',
      entity_type: 'items',
      status: errors.length > 0 ? 'partial_success' : 'success',
      response_data: {
        total_found: totalItems,
        created: createdCount,
        updated: updatedCount,
        processed: processedCount,
        errors: errors.length,
      },
      error_details: errors.length > 0 ? { errors } : null,
    });

  console.log(
    `Import completed: ${createdCount} created, ${updatedCount} updated, ${errors.length} errors`
  );

  return new Response(
    JSON.stringify({
      success: true,
      created: createdCount,
      updated: updatedCount,
      processed: processedCount,
      total_found: totalItems,
      errors: errors,
      message: `Processed ML items - ${createdCount} created, ${updatedCount} updated`,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
