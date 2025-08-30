import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  action: 'sync_product' | 'sync_batch' | 'get_sync_status' | 'import_from_ml';
  product_id?: string;
  product_ids?: string[];
  force_update?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Verify JWT and get user
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      throw new Error('Invalid authorization token');
    }

    // Get user's tenant_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    const tenantId = profile.tenant_id;

    // Get ML auth token
    const { data: authToken, error: authError } = await supabase
      .from('ml_auth_tokens')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (authError || !authToken) {
      throw new Error('Mercado Livre not connected. Please authenticate first.');
    }

    // Check if token is expired
    if (new Date(authToken.expires_at) <= new Date()) {
      throw new Error('Mercado Livre token expired. Please re-authenticate.');
    }

    const body: SyncRequest = await req.json();

    switch (body.action) {
      case 'sync_product': {
        if (!body.product_id) {
          throw new Error('Product ID is required');
        }

        const result = await syncSingleProduct(supabase, tenantId, body.product_id, authToken.access_token, body.force_update);
        
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync_batch': {
        if (!body.product_ids || body.product_ids.length === 0) {
          throw new Error('Product IDs array is required');
        }

        const results = [];
        for (const productId of body.product_ids) {
          try {
            const result = await syncSingleProduct(supabase, tenantId, productId, authToken.access_token, body.force_update);
            results.push({ product_id: productId, ...result });
          } catch (error) {
            results.push({ 
              product_id: productId, 
              success: false, 
              error: error.message 
            });
          }
        }

        return new Response(
          JSON.stringify({ results }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'import_from_ml': {
        const result = await importProductsFromML(supabase, tenantId, authToken.access_token);
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_sync_status': {
        // Get sync status for all products
        const { data: mappings, error: mappingError } = await supabase
          .from('ml_product_mapping')
          .select(`
            *,
            products!inner(id, name, sku)
          `)
          .eq('tenant_id', tenantId)
          .order('updated_at', { ascending: false });

        if (mappingError) {
          throw new Error('Failed to get sync status');
        }

        return new Response(
          JSON.stringify({ mappings: mappings || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
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

async function syncSingleProduct(
  supabase: SupabaseClient,
  tenantId: string,
  productId: string,
  accessToken: string,
  forceUpdate = false
) {
  const startTime = Date.now();

  try {
    // Get product data
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

    // Get existing mapping
    const { data: existingMapping, error: mappingError } = await supabase
      .from('ml_product_mapping')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('product_id', productId)
      .maybeSingle();

    if (mappingError) {
      throw new Error('Failed to get product mapping');
    }

    // Update mapping status to syncing
    await supabase
      .from('ml_product_mapping')
      .upsert({
        tenant_id: tenantId,
        product_id: productId,
        sync_status: 'syncing',
        last_sync_at: new Date().toISOString(),
      }, {
        onConflict: 'tenant_id,product_id',
      });

    // Get category mapping for ML
    let mlCategoryId = 'MLB1051'; // Default: Electronics
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

    // Build ML item data
    const mlItemData = {
      title: product.name,
      category_id: mlCategoryId,
      price: parseFloat(product.cost_unit) * 1.5, // Simple markup for demo
      currency_id: 'BRL',
      available_quantity: 999, // Default stock
      buying_mode: 'buy_it_now',
      listing_type_id: 'gold_special',
      condition: 'new',
      description: {
        plain_text: product.description || `Produto ${product.name}`
      },
      pictures: [], // TODO: Add product images
    };

    let mlResponse;
    let isUpdate = false;

    if (existingMapping?.ml_item_id && !forceUpdate) {
      // Update existing item
      isUpdate = true;
      mlResponse = await fetch(`https://api.mercadolibre.com/items/${existingMapping.ml_item_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mlItemData),
      });
    } else {
      // Create new item
      mlResponse = await fetch('https://api.mercadolibre.com/items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mlItemData),
      });
    }

    if (!mlResponse.ok) {
      const errorData = await mlResponse.json();
      console.error('ML API Error:', errorData);
      
      // Update mapping with error
      await supabase
        .from('ml_product_mapping')
        .upsert({
          tenant_id: tenantId,
          product_id: productId,
          sync_status: 'error',
          error_message: JSON.stringify(errorData),
          last_sync_at: new Date().toISOString(),
        }, {
          onConflict: 'tenant_id,product_id',
        });

      throw new Error(`Mercado Livre API error: ${errorData.message || 'Unknown error'}`);
    }

    const mlItem = await mlResponse.json();

    // Update mapping with success
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
      .upsert(mappingUpdate, {
        onConflict: 'tenant_id,product_id',
      });

    // Log success
    await supabase
      .from('ml_sync_log')
      .insert({
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
    // Log error
    await supabase
      .from('ml_sync_log')
      .insert({
        tenant_id: tenantId,
        operation_type: 'sync_product',
        entity_type: 'product',
        entity_id: productId,
        status: 'error',
        error_details: { message: error.message },
        execution_time_ms: Date.now() - startTime,
      });

    throw error;
  }
}

async function importProductsFromML(
  supabase: SupabaseClient,
  tenantId: string,
  accessToken: string
) {
  console.log('Starting ML product import for tenant:', tenantId);
  
  try {
    // Buscar produtos do usuário no ML
    const mlResponse = await fetch('https://api.mercadolibre.com/users/me/items/search?status=active', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!mlResponse.ok) {
      throw new Error(`ML API error: ${mlResponse.status}`);
    }

    const mlData = await mlResponse.json();
    console.log('Found ML products:', mlData.results?.length || 0);

    if (!mlData.results || mlData.results.length === 0) {
      return { success: true, message: 'Nenhum produto encontrado no Mercado Livre', imported: 0 };
    }

    let imported = 0;
    let errors = 0;

    // Processar cada produto do ML
    for (const mlItemId of mlData.results) {
      try {
        // Buscar detalhes do produto
        const itemResponse = await fetch(`https://api.mercadolibre.com/items/${mlItemId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!itemResponse.ok) {
          console.error(`Error fetching item ${mlItemId}:`, itemResponse.status);
          errors++;
          continue;
        }

        const itemData = await itemResponse.json();
        
        // Verificar se já existe mapping para este item
        const { data: existingMapping } = await supabase
          .from('ml_product_mapping')
          .select('product_id, products(*)')
          .eq('tenant_id', tenantId)
          .eq('ml_item_id', mlItemId)
          .maybeSingle();

        if (existingMapping) {
          console.log(`Product ${mlItemId} already mapped, skipping`);
          continue;
        }

        // Verificar se já existe produto com mesmo título/SKU
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('tenant_id', tenantId)
          .or(`name.eq.${itemData.title},sku.eq.${itemData.seller_custom_field || mlItemId}`)
          .maybeSingle();

        let productId;

        if (existingProduct) {
          // Atualizar produto existente
          productId = existingProduct.id;
          const { error: updateError } = await supabase
            .from('products')
            .update({
              source: 'mercado_livre',
              cost_unit: itemData.price * 0.7, // Estimativa de custo (70% do preço)
              updated_at: new Date().toISOString()
            })
            .eq('id', productId);

          if (updateError) {
            console.error('Error updating product:', updateError);
            errors++;
            continue;
          }
        } else {
          // Criar novo produto
          const { data: newProduct, error: createError } = await supabase
            .from('products')
            .insert({
              tenant_id: tenantId,
              name: itemData.title,
              description: itemData.description?.plain_text || null,
              sku: itemData.seller_custom_field || mlItemId,
              cost_unit: itemData.price * 0.7, // Estimativa de custo (70% do preço)
              packaging_cost: 0,
              tax_rate: 0,
              source: 'mercado_livre'
            })
            .select('id')
            .single();

          if (createError) {
            console.error('Error creating product:', createError);
            errors++;
            continue;
          }

          productId = newProduct.id;
        }

        // Criar ou atualizar mapping
        const { error: mappingError } = await supabase
          .from('ml_product_mapping')
          .upsert({
            tenant_id: tenantId,
            product_id: productId,
            ml_item_id: mlItemId,
            ml_title: itemData.title,
            ml_price: itemData.price,
            ml_category_id: itemData.category_id,
            ml_condition: itemData.condition,
            ml_listing_type: itemData.listing_type_id,
            ml_permalink: itemData.permalink,
            sync_status: 'synced',
            sync_direction: 'from_ml',
            last_sync_at: new Date().toISOString()
          }, {
            onConflict: 'tenant_id,product_id'
          });

        if (mappingError) {
          console.error('Error creating mapping:', mappingError);
          errors++;
          continue;
        }

        imported++;

        // Log da importação
        await supabase
          .from('ml_sync_log')
          .insert({
            tenant_id: tenantId,
            entity_id: productId,
            entity_type: 'product',
            operation_type: 'import_from_ml',
            status: 'success',
            ml_entity_id: mlItemId,
            response_data: { imported_product: itemData.title }
          });

      } catch (error) {
        console.error(`Error processing item ${mlItemId}:`, error);
        errors++;
      }
    }

    return {
      success: true,
      imported,
      errors,
      message: `Importados ${imported} produtos. ${errors} erros.`
    };

  } catch (error) {
    console.error('Error in importProductsFromML:', error);
    
    await supabase
      .from('ml_sync_log')
      .insert({
        tenant_id: tenantId,
        entity_type: 'system',
        operation_type: 'import_from_ml',
        status: 'error',
        error_details: { error: error.message }
      });

    throw error;
  }
}