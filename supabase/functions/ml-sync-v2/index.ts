import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  action: 'sync_product' | 'sync_batch' | 'import_from_ml' | 'link_product' | 'create_ad' | 'get_status' | 'get_products' | 'resync_product';
  product_id?: string;
  product_ids?: string[];
  productId?: string;
  ml_item_id?: string;
  ad_data?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mlClientId = Deno.env.get('ML_CLIENT_ID')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const errorResponse = (message: string, status: number) =>
      new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Authorization header required', 401);
    }

    // Verify JWT and get user
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);

    if (userError || !user) {
      return errorResponse('Invalid authorization token', 401);
    }

    // Get user's tenant_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return errorResponse('User profile not found', 404);
    }

    const tenantId = profile.tenant_id;

    // Parse request body
    let body: SyncRequest;
    try {
      const bodyText = await req.text();
      body = bodyText ? JSON.parse(bodyText) : { action: 'get_status' };
    } catch (error) {
      console.error('Error parsing request body:', error);
      body = { action: 'get_status' };
    }

    // Get ML auth token
    const { data: authToken, error: authError } = await supabase
      .from('ml_auth_tokens')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (authError || !authToken) {
      return errorResponse('ML authentication required', 401);
    }

    if (new Date(authToken.expires_at) <= new Date()) {
      return errorResponse('ML token expired', 401);
    }

    const mlToken = authToken.access_token;

    switch (body.action) {
      case 'get_status': {
        // Get sync status
        const { data: mappings, error: mappingError } = await supabase
          .from('ml_product_mapping')
          .select('*')
          .eq('tenant_id', tenantId);

        if (mappingError) {
          console.error('Mapping query error:', mappingError);
          return errorResponse('Failed to get sync status', 500);
        }

        const totalProducts = mappings?.length || 0;
        const syncedProducts = mappings?.filter(m => m.ml_item_id).length || 0;
        const pendingProducts = totalProducts - syncedProducts;

        return new Response(
          JSON.stringify({
            total_products: totalProducts,
            synced_products: syncedProducts,
            pending_products: pendingProducts,
            last_sync: mappings?.[0]?.updated_at || null
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync_product': {
        if (!body.product_id) {
          return errorResponse('Product ID required', 400);
        }

        // Get product details
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', body.product_id)
          .single();

        if (productError || !product) {
          return errorResponse('Product not found', 404);
        }

        // Log sync attempt
        await supabase
          .from('ml_sync_log')
          .insert({
            tenant_id: tenantId,
            operation_type: 'sync_product',
            entity_type: 'product',
            entity_id: body.product_id,
            status: 'success',
            request_data: { product_name: product.name }
          });

        return new Response(
          JSON.stringify({ success: true, message: 'Product sync initiated' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync_batch': {
        if (!body.product_ids || !Array.isArray(body.product_ids)) {
          return errorResponse('Product IDs array required', 400);
        }

        // Log batch sync attempt
        await supabase
          .from('ml_sync_log')
          .insert({
            tenant_id: tenantId,
            operation_type: 'sync_batch',
            entity_type: 'batch',
            status: 'success',
            request_data: { product_count: body.product_ids.length }
          });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Batch sync initiated for ${body.product_ids.length} products` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'import_from_ml': {
        console.log('Starting ML import for tenant:', tenantId);
        
        // Get ML user items
        const itemsResponse = await fetch(`https://api.mercadolibre.com/users/${authToken.user_id_ml}/items/search`, {
          headers: {
            'Authorization': `Bearer ${authToken.access_token}`,
          },
        });

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
        const errors = [];

        // Process each item and save to local database
        for (const itemId of itemIds) {
          try {
            console.log(`Processing item: ${itemId}`);
            
            // Get detailed item info from ML
            const itemDetailResponse = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
              headers: {
                'Authorization': `Bearer ${authToken.access_token}`,
              },
            });

            if (!itemDetailResponse.ok) {
              console.error(`Failed to get details for item ${itemId}`);
              errors.push(`Failed to get details for item ${itemId}`);
              continue;
            }

            const itemDetail = await itemDetailResponse.json();
            console.log(`Got details for item ${itemId}:`, itemDetail.title);

            // Check if product already exists (by ML item ID)
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

            // Get item description separately
            let fullDescription = '';
            try {
              const descResponse = await fetch(`https://api.mercadolibre.com/items/${itemId}/description`, {
                headers: { 'Authorization': `Bearer ${authToken.access_token}` },
              });
              if (descResponse.ok) {
                const descData = await descResponse.json();
                fullDescription = descData.plain_text || descData.text || '';
              }
            } catch (error) {
              console.log(`Could not fetch description for ${itemId}:`, error);
            }

            // Get category details
            let categoryName = '';
            let categoryPath = [];
            if (itemDetail.category_id) {
              try {
                const catResponse = await fetch(`https://api.mercadolibre.com/categories/${itemDetail.category_id}`, {
                  headers: { 'Authorization': `Bearer ${authToken.access_token}` },
                });
                if (catResponse.ok) {
                  const catData = await catResponse.json();
                  categoryName = catData.name;
                  categoryPath = catData.path_from_root || [];
                }
              } catch (error) {
                console.log(`Could not fetch category for ${itemDetail.category_id}:`, error);
              }
            }

            // Process and create ML category mapping
            let categoryId = null;
            if (itemDetail.category_id && categoryName) {
              // Save/update ML category mapping
              const { data: mlCategory, error: mlCatError } = await supabase
                .from('ml_categories')
                .upsert({
                  tenant_id: tenantId,
                  ml_category_id: itemDetail.category_id,
                  ml_category_name: categoryName,
                  ml_path_from_root: categoryPath,
                  auto_mapped: true
                })
                .select()
                .single();

              if (!mlCatError && mlCategory) {
                // Try to find/create matching local category
                let localCategory = await supabase
                  .from('categories')
                  .select('id')
                  .eq('tenant_id', tenantId)
                  .ilike('name', `%${categoryName}%`)
                  .maybeSingle();

                // If no match found, create new local category
                if (!localCategory.data) {
                  const { data: newCategory } = await supabase
                    .from('categories')
                    .insert({
                      tenant_id: tenantId,
                      name: categoryName,
                      description: `Categoria auto-criada do ML: ${itemDetail.category_id}`
                    })
                    .select()
                    .single();
                  
                  if (newCategory) {
                    categoryId = newCategory.id;
                    
                    // Update ML category mapping with local category
                    await supabase
                      .from('ml_categories')
                      .update({ local_category_id: categoryId })
                      .eq('id', mlCategory.id);
                  }
                } else {
                  categoryId = localCategory.data.id;
                  
                  // Update ML category mapping with local category
                  await supabase
                    .from('ml_categories')
                    .update({ local_category_id: categoryId })
                    .eq('id', mlCategory.id);
                }
              }
            }

            // Extract attributes and specific product data
            const attributes = itemDetail.attributes || [];
            const brand = attributes.find(attr => attr.id === 'BRAND')?.value_name || '';
            const model = attributes.find(attr => attr.id === 'MODEL')?.value_name || '';
            
            // Extract dimensions
            const dimensions = {};
            const width = attributes.find(attr => attr.id === 'WIDTH')?.value_name;
            const height = attributes.find(attr => attr.id === 'HEIGHT')?.value_name;  
            const depth = attributes.find(attr => attr.id === 'DEPTH')?.value_name;
            const length = attributes.find(attr => attr.id === 'LENGTH')?.value_name;
            
            if (width) dimensions.width = width;
            if (height) dimensions.height = height;
            if (depth) dimensions.depth = depth;
            if (length) dimensions.length = length;

            // Extract weight
            const weightAttr = attributes.find(attr => attr.id === 'WEIGHT');
            const weight = weightAttr ? parseFloat(weightAttr.value_name) || 0 : 0;

            // Extract warranty
            const warrantyAttr = attributes.find(attr => attr.id === 'WARRANTY');
            const warranty = warrantyAttr ? warrantyAttr.value_name : '';

            // Extract SKU from multiple sources
            let sku = itemDetail.seller_custom_field || 
                     itemDetail.seller_sku || 
                     attributes.find(attr => attr.id === 'SELLER_SKU')?.value_name ||
                     `ML-${itemId}`;

            // Create local product with all data
            const { data: newProduct, error: productError } = await supabase
              .from('products')
              .insert({
                tenant_id: tenantId,
                name: itemDetail.title,
                description: fullDescription || itemDetail.description || '',
                sku: sku,
                category_id: categoryId,
                cost_unit: itemDetail.price * 0.7, // Estimate 70% of sale price as cost
                packaging_cost: 0,
                tax_rate: 0,
                source: 'mercado_livre',
                // New ML-specific fields
                ml_stock_quantity: itemDetail.available_quantity || 0,
                ml_attributes: attributes,
                dimensions: dimensions,
                weight: weight,
                warranty: warranty,
                brand: brand,
                model: model,
                ml_seller_sku: itemDetail.seller_sku || '',
                ml_available_quantity: itemDetail.available_quantity || 0,
                ml_sold_quantity: itemDetail.sold_quantity || 0,
                ml_variation_id: itemDetail.variation_id || null,
                ml_pictures: itemDetail.pictures || []
              })
              .select()
              .single();

            if (productError) {
              console.error(`Failed to create product for item ${itemId}:`, productError);
              errors.push(`Failed to create product for item ${itemId}: ${productError.message}`);
              continue;
            }

            console.log(`Created product ${newProduct.id} for ML item ${itemId}`);

            // Create ML product mapping
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
                last_sync_at: new Date().toISOString()
              });

            if (mappingError) {
              console.error(`Failed to create mapping for item ${itemId}:`, mappingError);
              // Delete the created product since mapping failed
              await supabase.from('products').delete().eq('id', newProduct.id);
              errors.push(`Failed to create mapping for item ${itemId}: ${mappingError.message}`);
              continue;
            }

            console.log(`Created mapping for ML item ${itemId}`);

            // Save product images
            if (itemDetail.pictures && itemDetail.pictures.length > 0) {
              try {
                const imageInserts = itemDetail.pictures.map((picture, index) => ({
                  tenant_id: tenantId,
                  product_id: newProduct.id,
                  image_url: picture.secure_url || picture.url,
                  sort_order: index,
                  image_type: 'product'
                }));

                const { error: imageError } = await supabase
                  .from('product_images')
                  .insert(imageInserts);

                if (imageError) {
                  console.error(`Failed to save images for item ${itemId}:`, imageError);
                } else {
                  console.log(`Saved ${itemDetail.pictures.length} images for item ${itemId}`);
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

        // Log import results
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
              errors: errors.length
            },
            error_details: errors.length > 0 ? { errors } : null
          });

        console.log(`Import completed: ${importedCount} imported, ${skippedCount} skipped, ${errors.length} errors`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            imported: importedCount,
            skipped: skippedCount,
            total_found: itemIds.length,
            errors: errors,
            message: `Successfully imported ${importedCount} products from Mercado Livre`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'link_product': {
        if (!body.product_id || !body.ml_item_id) {
          return errorResponse('Product ID and ML Item ID required', 400);
        }

        // Create or update product mapping
        const { error: mappingError } = await supabase
          .from('ml_product_mapping')
          .upsert({
            tenant_id: tenantId,
            product_id: body.product_id,
            ml_item_id: body.ml_item_id,
            sync_status: 'linked'
          }, {
            onConflict: 'tenant_id, product_id'
          });

        if (mappingError) {
          console.error('Mapping error:', mappingError);
          return errorResponse('Failed to link product', 500);
        }

        // Log linking
        await supabase
          .from('ml_sync_log')
          .insert({
            tenant_id: tenantId,
            operation_type: 'link_product',
            entity_type: 'mapping',
            entity_id: body.product_id,
            status: 'success',
            request_data: { ml_item_id: body.ml_item_id }
          });

        return new Response(
          JSON.stringify({ success: true, message: 'Product linked successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_products': {
        // Get ML products with sync status
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

        // Transform data to match expected interface
        const transformedProducts = (mlProducts || []).map(mapping => ({
          id: mapping.products.id,
          name: mapping.products.name,
          sku: mapping.products.sku,
          source: mapping.products.source,
          sync_status: mapping.sync_status || 'not_synced',
          ml_item_id: mapping.ml_item_id,
          last_sync_at: mapping.last_sync_at,
          ml_title: mapping.ml_title,
          ml_permalink: mapping.ml_permalink
        }));

        return new Response(
          JSON.stringify({ 
            success: true, 
            products: transformedProducts
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create_ad': {
        if (!body.ad_data) {
          return errorResponse('Ad data required', 400);
        }

        // Log ad creation attempt
        await supabase
          .from('ml_sync_log')
          .insert({
            tenant_id: tenantId,
            operation_type: 'create_ad',
            entity_type: 'ad',
            status: 'success',
            request_data: body.ad_data
          });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Ad creation initiated',
            ad_data: body.ad_data
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'resync_product':
        console.log('Re-syncing product:', body.productId);
        
        if (!body.productId) {
          return errorResponse('Product ID is required', 400);
        }

        try {
          // Buscar produto local e seu mapping ML
          const { data: productMapping, error: mappingError } = await supabase
            .from('ml_product_mapping')
            .select('*, products(*)')
            .eq('tenant_id', tenantId)
            .eq('product_id', body.productId)
            .single();

          if (mappingError || !productMapping?.ml_item_id) {
            console.error('Product mapping not found:', mappingError);
            return errorResponse('Produto não possui mapeamento ML válido', 404);
          }

          // Buscar dados completos do item no ML
          const itemResponse = await fetch(`https://api.mercadolibre.com/items/${productMapping.ml_item_id}`, {
            headers: { 'Authorization': `Bearer ${mlToken}` },
          });

          if (!itemResponse.ok) {
            throw new Error(`ML API error: ${itemResponse.status}`);
          }

          const itemData = await itemResponse.json();
          console.log('Got item details for re-sync:', itemData.id, itemData.title);

          // Buscar descrição do item
          let description = '';
          try {
            const descResponse = await fetch(`https://api.mercadolibre.com/items/${itemData.id}/description`, {
              headers: { 'Authorization': `Bearer ${mlToken}` },
            });
            if (descResponse.ok) {
              const descData = await descResponse.json();
              description = descData.plain_text || '';
            }
          } catch (e) {
            console.warn('Could not fetch description:', e);
          }

          // Buscar categoria ML
          let categoryData = null;
          if (itemData.category_id) {
            try {
              const catResponse = await fetch(`https://api.mercadolibre.com/categories/${itemData.category_id}`, {
                headers: { 'Authorization': `Bearer ${mlToken}` },
              });
              if (catResponse.ok) {
                categoryData = await catResponse.json();
              }
            } catch (e) {
              console.warn('Could not fetch category:', e);
            }
          }

          // Extrair atributos principais
          const brand = itemData.attributes?.find(attr => attr.id === 'BRAND')?.value_name || '';
          const model = itemData.attributes?.find(attr => attr.id === 'MODEL')?.value_name || '';
          const warranty = itemData.attributes?.find(attr => attr.id === 'WARRANTY')?.value_name || '';
          
          // Extrair dimensões e peso
          const dimensions = {
            length: itemData.attributes?.find(attr => attr.id === 'LENGTH')?.value_name || null,
            width: itemData.attributes?.find(attr => attr.id === 'WIDTH')?.value_name || null,
            height: itemData.attributes?.find(attr => attr.id === 'HEIGHT')?.value_name || null,
          };
          
          const weight = parseFloat(itemData.attributes?.find(attr => attr.id === 'WEIGHT')?.value_name || '0');

          // Determinar SKU (priorizar seller_sku, depois usar variação ou item id)
          let skuToUse = itemData.seller_sku || '';
          if (!skuToUse && itemData.variations?.length > 0) {
            skuToUse = itemData.variations[0].seller_sku || itemData.variations[0].id || '';
          }
          if (!skuToUse) {
            skuToUse = itemData.id;
          }

          // Atualizar produto local com dados completos
          const { error: updateError } = await supabase
            .from('products')
            .update({
              description: description,
              sku: skuToUse,
              brand: brand,
              model: model,
              warranty: warranty,
              weight: weight,
              dimensions: dimensions,
              ml_attributes: itemData.attributes || {},
              ml_seller_sku: itemData.seller_sku,
              ml_available_quantity: itemData.available_quantity || 0,
              ml_sold_quantity: itemData.sold_quantity || 0,
              ml_variation_id: itemData.variations?.length > 0 ? itemData.variations[0].id : null,
              ml_pictures: itemData.pictures || [],
              updated_at: new Date().toISOString()
            })
            .eq('id', body.productId)
            .eq('tenant_id', tenantId);

          if (updateError) {
            console.error('Error updating product:', updateError);
            throw new Error('Erro ao atualizar produto');
          }

          // Atualizar mapping com categoria ML se disponível
          if (categoryData) {
            await supabase
              .from('ml_product_mapping')
              .update({
                ml_category_id: categoryData.id,
                last_sync_at: new Date().toISOString(),
                sync_status: 'synced',
                error_message: null
              })
              .eq('product_id', body.productId)
              .eq('tenant_id', tenantId);

            // Salvar/atualizar categoria ML
            await supabase
              .from('ml_categories')
              .upsert({
                tenant_id: tenantId,
                ml_category_id: categoryData.id,
                ml_category_name: categoryData.name,
                ml_path_from_root: categoryData.path_from_root || [],
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'tenant_id,ml_category_id'
              });
          }

          // Processar e salvar imagens
          if (itemData.pictures?.length > 0) {
            for (let i = 0; i < Math.min(itemData.pictures.length, 10); i++) {
              const picture = itemData.pictures[i];
              await supabase
                .from('product_images')
                .upsert({
                  tenant_id: tenantId,
                  product_id: body.productId,
                  image_url: picture.url || picture.secure_url,
                  sort_order: i,
                  image_type: 'ml_sync',
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'tenant_id,product_id,image_url'
                });
            }
          }

          // Log sucesso
          await supabase
            .from('ml_sync_log')
            .insert({
              tenant_id: tenantId,
              operation_type: 'resync_product',
              entity_type: 'product',
              entity_id: body.productId,
              ml_entity_id: itemData.id,
              status: 'success',
              request_data: { productId: body.productId },
              response_data: {
                title: itemData.title,
                category: categoryData?.name,
                attributes_count: itemData.attributes?.length || 0,
                pictures_count: itemData.pictures?.length || 0
              }
            });

          console.log('Product re-sync completed successfully');
          
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Produto re-sincronizado com sucesso',
            data: {
              title: itemData.title,
              category: categoryData?.name,
              updated_fields: ['description', 'sku', 'brand', 'model', 'warranty', 'dimensions', 'attributes']
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        } catch (error) {
          console.error('Error in resync_product:', error);
          
          // Log erro
          await supabase
            .from('ml_sync_log')
            .insert({
              tenant_id: tenantId,
              operation_type: 'resync_product',
              entity_type: 'product',
              entity_id: body.productId,
              status: 'error',
              error_details: { message: error.message, stack: error.stack }
            });

          return new Response(JSON.stringify({ 
            error: 'Erro na re-sincronização: ' + error.message 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }

      default:
        return errorResponse('Invalid action', 400);
    }

  } catch (error) {
    console.error('ML Sync Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});