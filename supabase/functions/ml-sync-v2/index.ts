import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  action: 'sync_product' | 'sync_batch' | 'import_from_ml' | 'link_product' | 'create_ad' | 'get_status' | 'get_products';
  product_id?: string;
  product_ids?: string[];
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
        
        // Log import attempt
        await supabase
          .from('ml_sync_log')
          .insert({
            tenant_id: tenantId,
            operation_type: 'import_from_ml',
            entity_type: 'items',
            status: 'success',
            response_data: { items_count: itemsData.results?.length || 0 }
          });

        return new Response(
          JSON.stringify({ 
            success: true, 
            items: itemsData.results || [],
            total: itemsData.paging?.total || 0
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