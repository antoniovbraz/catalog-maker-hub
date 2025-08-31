import {
  ActionContext,
  ImportFromMLRequest,
  errorResponse,
  corsHeaders,
} from '../types.ts';

export async function importFromML(
  _req: ImportFromMLRequest,
  { supabase, tenantId, authToken }: ActionContext
): Promise<Response> {
  console.log('Starting ML import for tenant:', tenantId);

  const itemsResponse = await fetch(
    `https://api.mercadolibre.com/users/${authToken.user_id_ml}/items/search`,
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

  console.log(`Found ${itemIds.length} ML items to import`);

  let importedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (const itemId of itemIds) {
    try {
      console.log(`Processing item: ${itemId}`);

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

      const { data: existingMapping } = await supabase
        .from('ml_product_mapping')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('ml_item_id', itemId)
        .maybeSingle();

      if (existingMapping) {
        console.log(`Item ${itemId} already exists, skipping`);
        skippedCount++;
        continue;
      }

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
      let categoryPath: any[] = [];
      if (itemDetail.category_id) {
        try {
          const catResponse = await fetch(
            `https://api.mercadolibre.com/categories/${itemDetail.category_id}`,
            { headers: { Authorization: `Bearer ${authToken.access_token}` } }
          );
          if (catResponse.ok) {
            const catData = await catResponse.json();
            categoryName = catData.name;
            categoryPath = catData.path_from_root || [];
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
            ml_path_from_root: categoryPath,
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
              categoryId = newCategory.id;
              await supabase
                .from('ml_categories')
                .update({ local_category_id: categoryId })
                .eq('id', mlCategory.id);
            }
          } else {
            categoryId = localCategory.data.id;
            await supabase
              .from('ml_categories')
              .update({ local_category_id: categoryId })
              .eq('id', mlCategory.id);
          }
        }
      }

      const attributes = itemDetail.attributes || [];
      const brand = attributes.find((attr: any) => attr.id === 'BRAND')?.value_name || '';
      const model = attributes.find((attr: any) => attr.id === 'MODEL')?.value_name || '';

      const dimensions: Record<string, any> = {};
      const width = attributes.find((attr: any) => attr.id === 'WIDTH')?.value_name;
      const height = attributes.find((attr: any) => attr.id === 'HEIGHT')?.value_name;
      const depth = attributes.find((attr: any) => attr.id === 'DEPTH')?.value_name;
      const length = attributes.find((attr: any) => attr.id === 'LENGTH')?.value_name;
      if (width) dimensions.width = width;
      if (height) dimensions.height = height;
      if (depth) dimensions.depth = depth;
      if (length) dimensions.length = length;

      const weightAttr = attributes.find((attr: any) => attr.id === 'WEIGHT');
      const weight = weightAttr ? parseFloat(weightAttr.value_name) || 0 : 0;

      const warrantyAttr = attributes.find((attr: any) => attr.id === 'WARRANTY');
      const warranty = warrantyAttr ? warrantyAttr.value_name : '';

      // Gerar SKU limpo e único baseado no título do produto
      const baseTitle = itemDetail.title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15).toUpperCase();
      const sku = `${baseTitle}-${itemId.substring(itemId.length - 6)}`;
      
      // Capturar seller_sku do ML separadamente para referência
      const mlSellerSku = itemDetail.seller_custom_field || 
                         itemDetail.seller_sku || 
                         attributes.find((attr: any) => attr.id === 'SELLER_SKU')?.value_name || 
                         null;

      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          tenant_id: tenantId,
          name: itemDetail.title,
          description: fullDescription || itemDetail.description || '',
          sku: sku,
          category_id: categoryId,
          cost_unit: itemDetail.price * 0.7,
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
          ml_seller_sku: mlSellerSku,
          ml_available_quantity: itemDetail.available_quantity || 0,
          ml_sold_quantity: itemDetail.sold_quantity || 0,
          ml_variation_id: itemDetail.variation_id || null,
          ml_pictures: itemDetail.pictures || [],
        })
        .select()
        .single();

      if (productError) {
        console.error(`Failed to create product for item ${itemId}:`, productError);
        errors.push(
          `Failed to create product for item ${itemId}: ${productError.message}`
        );
        continue;
      }

      console.log(`Created product ${newProduct.id} for ML item ${itemId}`);

      const { error: mappingError } = await supabase
        .from('ml_product_mapping')
        .insert({
          tenant_id: tenantId,
          product_id: newProduct.id,
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
        });

      if (mappingError) {
        console.error(
          `Failed to create mapping for item ${itemId}:`,
          mappingError
        );
        await supabase.from('products').delete().eq('id', newProduct.id);
        errors.push(
          `Failed to create mapping for item ${itemId}: ${mappingError.message}`
        );
        continue;
      }

      console.log(`Created mapping for ML item ${itemId}`);

      if (itemDetail.pictures && itemDetail.pictures.length > 0) {
        try {
          const imageInserts = itemDetail.pictures.map((picture: any, index: number) => ({
            tenant_id: tenantId,
            product_id: newProduct.id,
            image_url: picture.secure_url || picture.url,
            sort_order: index,
            image_type: 'product',
          }));

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

      importedCount++;
    } catch (error) {
      console.error(`Error processing item ${itemId}:`, error);
      errors.push(`Error processing item ${itemId}: ${error.message}`);
    }
  }

  await supabase
    .from('ml_sync_log')
    .insert({
      tenant_id: tenantId,
      operation_type: 'import_from_ml',
      entity_type: 'items',
      status: errors.length > 0 ? 'partial_success' : 'success',
      response_data: {
        total_found: itemIds.length,
        imported: importedCount,
        skipped: skippedCount,
        errors: errors.length,
      },
      error_details: errors.length > 0 ? { errors } : null,
    });

  console.log(
    `Import completed: ${importedCount} imported, ${skippedCount} skipped, ${errors.length} errors`
  );

  return new Response(
    JSON.stringify({
      success: true,
      imported: importedCount,
      skipped: skippedCount,
      total_found: itemIds.length,
      errors: errors,
      message: `Successfully imported ${importedCount} products from Mercado Livre`,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
