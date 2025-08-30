// Nova ML Sync Function - Modular e seguindo princípios SOLID
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MLService, withAuth, MLSyncRequest } from '../shared/ml-service.ts';

serve(async (req) => {
  return withAuth(req, async ({ tenantId, userId }) => {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const mlService = new MLService(supabaseUrl, serviceKey);
    
    try {
      // Inicializar service com token ML
      const initialized = await mlService.initialize(tenantId);
      if (!initialized) {
        return mlService.createResponse({ 
          error: 'ML token not found or expired. Please reconnect your Mercado Livre account.' 
        }, 401);
      }

      const requestData: MLSyncRequest = await req.json();
      console.log('ML Sync request:', requestData);

      // Roteamento para operações específicas
      switch (requestData.action) {
        case 'sync_product':
          return await handleSyncProduct(mlService, tenantId, requestData.product_id!);
        
        case 'sync_batch':
          return await handleSyncBatch(mlService, tenantId, requestData.product_ids!);
        
        case 'import_from_ml':
          return await handleImportFromML(mlService, tenantId);
        
        case 'get_sync_status':
          return await handleGetSyncStatus(mlService, tenantId);
        
        case 'link_product':
          return await handleLinkProduct(mlService, tenantId, requestData.product_id!, requestData.ml_item_id!);
        
        case 'create_ad':
          return await handleCreateAd(mlService, tenantId, requestData.product_id!, requestData.ad_data);
        
        default:
          return mlService.createResponse({ 
            error: `Unsupported action: ${requestData.action}` 
          }, 400);
      }
    } catch (error) {
      return mlService.handleError(error, 'ml-sync-v2');
    }
  });
});

// Handler para sincronizar produto individual
async function handleSyncProduct(
  mlService: MLService, 
  tenantId: string, 
  productId: string
): Promise<Response> {
  const startTime = Date.now();
  
  try {
    // Check rate limit
    const canProceed = await mlService.checkRateLimit(tenantId, 'sync_product');
    if (!canProceed) {
      return mlService.createResponse({ 
        error: 'Rate limit exceeded. Please try again later.' 
      }, 429);
    }

    // Buscar dados do produto
    const { data: product, error: productError } = await mlService.supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .eq('id', productId)
      .eq('tenant_id', tenantId)
      .single();

    if (productError || !product) {
      await mlService.logOperation(
        tenantId,
        'sync_product',
        'product',
        'error',
        productId,
        undefined,
        { productId },
        undefined,
        { message: 'Product not found' }
      );
      return mlService.createResponse({ error: 'Product not found' }, 404);
    }

    // Validar dados do produto
    const validation = mlService.validateProductData(product);
    if (!validation.valid) {
      await mlService.logOperation(
        tenantId,
        'sync_product',
        'product',
        'error',
        productId,
        undefined,
        { productId },
        undefined,
        { message: 'Validation failed', errors: validation.errors }
      );
      return mlService.createResponse({ 
        error: 'Product validation failed', 
        details: validation.errors 
      }, 400);
    }

    // Buscar mapping existente
    const { data: mapping } = await mlService.supabase
      .from('ml_product_mapping')
      .select('*')
      .eq('product_id', productId)
      .eq('tenant_id', tenantId)
      .single();

    // Atualizar status para 'syncing'
    await mlService.supabase
      .from('ml_product_mapping')
      .upsert({
        tenant_id: tenantId,
        product_id: productId,
        sync_status: 'syncing',
        sync_direction: 'to_ml'
      });

    // Buscar categoria ML mapeada
    let mlCategoryId = 'MLB1648'; // Categoria padrão
    if (product.category_id) {
      const { data: categoryMapping } = await mlService.supabase
        .from('ml_category_mapping')
        .select('ml_category_id')
        .eq('category_id', product.category_id)
        .eq('tenant_id', tenantId)
        .single();
      
      if (categoryMapping) {
        mlCategoryId = categoryMapping.ml_category_id;
      }
    }

    // Preparar dados para ML
    const mlItemData = mlService.mapProductToML(product, mlCategoryId);

    let mlResponse;
    let mlItemId = mapping?.ml_item_id;

    if (mlItemId) {
      // Atualizar item existente
      mlResponse = await mlService.callMLAPI(`/items/${mlItemId}`, 'PUT', mlItemData);
    } else {
      // Criar novo item
      mlResponse = await mlService.callMLAPI('/items', 'POST', mlItemData);
      if (mlResponse.success) {
        mlItemId = mlResponse.data.id;
      }
    }

    const executionTime = Date.now() - startTime;

    if (mlResponse.success) {
      // Atualizar mapping com sucesso
      await mlService.supabase
        .from('ml_product_mapping')
        .upsert({
          tenant_id: tenantId,
          product_id: productId,
          ml_item_id: mlItemId,
          sync_status: 'synced',
          sync_direction: 'to_ml',
          last_sync_at: new Date().toISOString(),
          ml_price: mlResponse.data.price,
          ml_permalink: mlResponse.data.permalink,
          ml_title: mlResponse.data.title,
          ml_currency_id: mlResponse.data.currency_id,
          ml_listing_type: mlResponse.data.listing_type_id,
          ml_condition: mlResponse.data.condition,
          ml_category_id: mlResponse.data.category_id,
          error_message: null
        });

      await mlService.logOperation(
        tenantId,
        'sync_product',
        'product',
        'success',
        productId,
        mlItemId,
        mlItemData,
        mlResponse.data,
        undefined,
        executionTime
      );

      return mlService.createResponse({
        success: true,
        ml_item_id: mlItemId,
        ml_permalink: mlResponse.data.permalink,
        execution_time_ms: executionTime
      });
    } else {
      // Atualizar mapping com erro
      await mlService.supabase
        .from('ml_product_mapping')
        .upsert({
          tenant_id: tenantId,
          product_id: productId,
          sync_status: 'error',
          error_message: mlResponse.error,
          last_sync_at: new Date().toISOString()
        });

      await mlService.logOperation(
        tenantId,
        'sync_product',
        'product',
        'error',
        productId,
        mlItemId,
        mlItemData,
        mlResponse.data,
        { message: mlResponse.error, status_code: mlResponse.status_code },
        executionTime
      );

      return mlService.createResponse({
        error: 'Failed to sync product to ML',
        details: mlResponse.error,
        status_code: mlResponse.status_code
      }, 400);
    }
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    await mlService.logOperation(
      tenantId,
      'sync_product',
      'product',
      'error',
      productId,
      undefined,
      { productId },
      undefined,
      { message: error.message },
      executionTime
    );

    throw error;
  }
}

// Handler para sincronização em lote
async function handleSyncBatch(
  mlService: MLService, 
  tenantId: string, 
  productIds: string[]
): Promise<Response> {
  const results = [];
  const errors = [];

  for (const productId of productIds) {
    try {
      const result = await handleSyncProduct(mlService, tenantId, productId);
      const resultData = await result.json();
      
      if (result.status === 200) {
        results.push({ product_id: productId, ...resultData });
      } else {
        errors.push({ product_id: productId, error: resultData.error });
      }
    } catch (error) {
      errors.push({ product_id: productId, error: error.message });
    }
  }

  return mlService.createResponse({
    success: true,
    results,
    errors,
    total_processed: productIds.length,
    successful: results.length,
    failed: errors.length
  });
}

// Handler para importar produtos do ML
async function handleImportFromML(
  mlService: MLService, 
  tenantId: string
): Promise<Response> {
  const startTime = Date.now();
  
  try {
    console.log('Starting ML product import for tenant:', tenantId);

    // Buscar lista de produtos do usuário no ML
    const mlResponse = await mlService.callMLAPI('/users/me/items/search?status=active&limit=50');
    
    if (!mlResponse.success) {
      await mlService.logOperation(
        tenantId,
        'import_from_ml',
        'products',
        'error',
        undefined,
        undefined,
        {},
        mlResponse.data,
        { message: mlResponse.error, status_code: mlResponse.status_code }
      );
      
      return mlService.createResponse({
        error: 'Failed to fetch ML products',
        details: mlResponse.error
      }, 400);
    }

    const mlItems = mlResponse.data.results || [];
    const importResults = [];
    const importErrors = [];

    for (const mlItemId of mlItems) {
      try {
        // Buscar detalhes do item
        const itemResponse = await mlService.callMLAPI(`/items/${mlItemId}`);
        
        if (!itemResponse.success) {
          importErrors.push({ ml_item_id: mlItemId, error: itemResponse.error });
          continue;
        }

        const mlItem = itemResponse.data;

        // Verificar se já existe mapping
        const { data: existingMapping } = await mlService.supabase
          .from('ml_product_mapping')
          .select('id, product_id')
          .eq('ml_item_id', mlItemId)
          .eq('tenant_id', tenantId)
          .single();

        if (existingMapping) {
          importResults.push({
            ml_item_id: mlItemId,
            action: 'skipped',
            reason: 'Already mapped'
          });
          continue;
        }

        // Buscar produto local por nome ou SKU
        let localProduct = null;
        
        if (mlItem.seller_custom_field) {
          const { data } = await mlService.supabase
            .from('products')
            .select('*')
            .eq('sku', mlItem.seller_custom_field)
            .eq('tenant_id', tenantId)
            .single();
          localProduct = data;
        }

        if (!localProduct) {
          const { data } = await mlService.supabase
            .from('products')
            .select('*')
            .ilike('name', `%${mlItem.title.substring(0, 30)}%`)
            .eq('tenant_id', tenantId)
            .limit(1)
            .single();
          localProduct = data;
        }

        if (!localProduct) {
          // Criar novo produto local
          const { data: newProduct, error: createError } = await mlService.supabase
            .from('products')
            .insert({
              tenant_id: tenantId,
              name: mlItem.title,
              description: mlItem.descriptions?.[0]?.plain_text || '',
              cost_unit: mlItem.price * 0.7, // Estimar custo como 70% do preço
              sku: mlItem.seller_custom_field || `ML-${mlItemId}`,
              source: 'mercado_livre'
            })
            .select()
            .single();

          if (createError) {
            importErrors.push({ 
              ml_item_id: mlItemId, 
              error: `Failed to create product: ${createError.message}` 
            });
            continue;
          }

          localProduct = newProduct;
        }

        // Criar mapping
        await mlService.supabase
          .from('ml_product_mapping')
          .insert({
            tenant_id: tenantId,
            product_id: localProduct.id,
            ml_item_id: mlItemId,
            sync_status: 'synced',
            sync_direction: 'from_ml',
            last_sync_at: new Date().toISOString(),
            ml_price: mlItem.price,
            ml_permalink: mlItem.permalink,
            ml_title: mlItem.title,
            ml_currency_id: mlItem.currency_id,
            ml_listing_type: mlItem.listing_type_id,
            ml_condition: mlItem.condition,
            ml_category_id: mlItem.category_id
          });

        importResults.push({
          ml_item_id: mlItemId,
          product_id: localProduct.id,
          action: localProduct.source === 'mercado_livre' ? 'created' : 'linked',
          title: mlItem.title
        });

      } catch (error) {
        importErrors.push({ 
          ml_item_id: mlItemId, 
          error: error.message 
        });
      }
    }

    const executionTime = Date.now() - startTime;

    await mlService.logOperation(
      tenantId,
      'import_from_ml',
      'products',
      'success',
      undefined,
      undefined,
      { total_items: mlItems.length },
      { 
        imported: importResults.length, 
        errors: importErrors.length,
        results: importResults 
      },
      importErrors.length > 0 ? { errors: importErrors } : undefined,
      executionTime
    );

    return mlService.createResponse({
      success: true,
      imported: importResults.length,
      errors: importErrors.length,
      total_ml_items: mlItems.length,
      results: importResults,
      import_errors: importErrors,
      execution_time_ms: executionTime
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    await mlService.logOperation(
      tenantId,
      'import_from_ml',
      'products',
      'error',
      undefined,
      undefined,
      {},
      undefined,
      { message: error.message },
      executionTime
    );

    throw error;
  }
}

// Handler para buscar status de sincronização
async function handleGetSyncStatus(
  mlService: MLService, 
  tenantId: string
): Promise<Response> {
  try {
    const { data: mappings, error } = await mlService.supabase
      .from('ml_product_mapping')
      .select(`
        *,
        products (
          id,
          name,
          sku
        )
      `)
      .eq('tenant_id', tenantId)
      .order('last_sync_at', { ascending: false });

    if (error) {
      throw error;
    }

    const statusCounts = {
      total: mappings.length,
      synced: mappings.filter(m => m.sync_status === 'synced').length,
      pending: mappings.filter(m => m.sync_status === 'pending').length,
      error: mappings.filter(m => m.sync_status === 'error').length,
      syncing: mappings.filter(m => m.sync_status === 'syncing').length
    };

    return mlService.createResponse({
      success: true,
      status_counts: statusCounts,
      products: mappings.map(mapping => ({
        id: mapping.products.id,
        name: mapping.products.name,
        sku: mapping.products.sku,
        ml_item_id: mapping.ml_item_id,
        sync_status: mapping.sync_status,
        last_sync_at: mapping.last_sync_at,
        ml_permalink: mapping.ml_permalink,
        error_message: mapping.error_message
      }))
    });
  } catch (error) {
    throw error;
  }
}

// Handler para vincular produto existente a item ML
async function handleLinkProduct(
  mlService: MLService, 
  tenantId: string, 
  productId: string, 
  mlItemId: string
): Promise<Response> {
  try {
    // Validar se o item ML existe
    const mlResponse = await mlService.callMLAPI(`/items/${mlItemId}`);
    
    if (!mlResponse.success) {
      return mlService.createResponse({
        error: 'ML item not found or inaccessible',
        details: mlResponse.error
      }, 404);
    }

    const mlItem = mlResponse.data;

    // Criar/atualizar mapping
    const { error } = await mlService.supabase
      .from('ml_product_mapping')
      .upsert({
        tenant_id: tenantId,
        product_id: productId,
        ml_item_id: mlItemId,
        sync_status: 'synced',
        sync_direction: 'linked',
        last_sync_at: new Date().toISOString(),
        ml_price: mlItem.price,
        ml_permalink: mlItem.permalink,
        ml_title: mlItem.title,
        ml_currency_id: mlItem.currency_id,
        ml_listing_type: mlItem.listing_type_id,
        ml_condition: mlItem.condition,
        ml_category_id: mlItem.category_id
      });

    if (error) {
      throw error;
    }

    await mlService.logOperation(
      tenantId,
      'link_product',
      'product',
      'success',
      productId,
      mlItemId,
      { productId, mlItemId },
      mlItem
    );

    return mlService.createResponse({
      success: true,
      message: 'Product linked successfully',
      ml_item_id: mlItemId,
      ml_permalink: mlItem.permalink
    });
  } catch (error) {
    await mlService.logOperation(
      tenantId,
      'link_product',
      'product',
      'error',
      productId,
      mlItemId,
      { productId, mlItemId },
      undefined,
      { message: error.message }
    );
    throw error;
  }
}

// Handler para criar anúncio personalizado
async function handleCreateAd(
  mlService: MLService, 
  tenantId: string, 
  productId: string,
  adData: any
): Promise<Response> {
  try {
    // Buscar produto
    const { data: product, error: productError } = await mlService.supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('tenant_id', tenantId)
      .single();

    if (productError || !product) {
      return mlService.createResponse({ error: 'Product not found' }, 404);
    }

    // Preparar dados do anúncio com customizações
    const mlItemData = {
      ...mlService.mapProductToML(product),
      ...adData // Sobrescrever com dados customizados
    };

    // Validar dados customizados
    if (adData.price && adData.price <= 0) {
      return mlService.createResponse({ 
        error: 'Invalid price in ad data' 
      }, 400);
    }

    // Criar anúncio no ML
    const mlResponse = await mlService.callMLAPI('/items', 'POST', mlItemData);

    if (mlResponse.success) {
      const mlItemId = mlResponse.data.id;

      // Atualizar mapping
      await mlService.supabase
        .from('ml_product_mapping')
        .upsert({
          tenant_id: tenantId,
          product_id: productId,
          ml_item_id: mlItemId,
          sync_status: 'synced',
          sync_direction: 'to_ml',
          last_sync_at: new Date().toISOString(),
          ml_price: mlResponse.data.price,
          ml_permalink: mlResponse.data.permalink,
          ml_title: mlResponse.data.title,
          ml_currency_id: mlResponse.data.currency_id,
          ml_listing_type: mlResponse.data.listing_type_id,
          ml_condition: mlResponse.data.condition,
          ml_category_id: mlResponse.data.category_id
        });

      await mlService.logOperation(
        tenantId,
        'create_ad',
        'product',
        'success',
        productId,
        mlItemId,
        mlItemData,
        mlResponse.data
      );

      return mlService.createResponse({
        success: true,
        ml_item_id: mlItemId,
        ml_permalink: mlResponse.data.permalink,
        title: mlResponse.data.title,
        price: mlResponse.data.price
      });
    } else {
      await mlService.logOperation(
        tenantId,
        'create_ad',
        'product',
        'error',
        productId,
        undefined,
        mlItemData,
        mlResponse.data,
        { message: mlResponse.error, status_code: mlResponse.status_code }
      );

      return mlService.createResponse({
        error: 'Failed to create ML ad',
        details: mlResponse.error
      }, 400);
    }
  } catch (error) {
    await mlService.logOperation(
      tenantId,
      'create_ad',
      'product',
      'error',
      productId,
      undefined,
      { productId, adData },
      undefined,
      { message: error.message }
    );
    throw error;
  }
}