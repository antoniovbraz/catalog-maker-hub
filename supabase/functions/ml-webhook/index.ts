import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MLWebhookPayload {
  topic: string;
  resource: string;
  user_id: number;
  application_id: number;
  attempts: number;
  sent: string;
  received: string;
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

    const payload: MLWebhookPayload = await req.json();
    console.log('Received ML webhook:', payload);

    // Find tenant by ML user ID
    const { data: tenantData, error: tenantError } = await supabase
      .rpc('get_tenant_by_ml_user_id', { p_user_id_ml: payload.user_id });

    if (tenantError || !tenantData) {
      console.error('Tenant not found for ML user:', payload.user_id);
      return new Response('Tenant not found', { status: 404 });
    }

    const tenantId = tenantData;

    // Log webhook event
    const { error: logError } = await supabase
      .from('ml_webhook_events')
      .insert({
        tenant_id: tenantId,
        user_id_ml: payload.user_id,
        application_id: payload.application_id,
        topic: payload.topic,
        resource: payload.resource,
        attempts: payload.attempts,
        raw_payload: payload,
      });

    if (logError) {
      console.error('Failed to log webhook event:', logError);
    }

    // Process webhook based on topic
    switch (payload.topic) {
      case 'orders_v2':
        await processOrderWebhook(supabase, tenantId, payload);
        break;
      
      case 'items':
        await processItemWebhook(supabase, tenantId, payload);
        break;
      
      default:
        console.log('Unhandled webhook topic:', payload.topic);
    }

    // Mark webhook as processed
    await supabase
      .from('ml_webhook_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .eq('resource', payload.resource)
      .eq('topic', payload.topic);

    return new Response('OK', { 
      status: 200,
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('ML Webhook Error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function processOrderWebhook(
  supabase: any,
  tenantId: string,
  payload: MLWebhookPayload
) {
  console.log('Processing order webhook for tenant:', tenantId);
  
  try {
    // Get ML auth token for this tenant
    const { data: authToken, error: authError } = await supabase
      .from('ml_auth_tokens')
      .select('access_token')
      .eq('tenant_id', tenantId)
      .single();

    if (authError || !authToken) {
      throw new Error('ML auth token not found');
    }

    // Fetch order details from ML API
    const orderResponse = await fetch(`https://api.mercadolibre.com${payload.resource}`, {
      headers: {
        'Authorization': `Bearer ${authToken.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!orderResponse.ok) {
      throw new Error(`Failed to fetch order: ${orderResponse.status}`);
    }

    const orderData = await orderResponse.json();

    // Process order items
    for (const item of orderData.order_items || []) {
      await supabase
        .from('ml_orders')
        .upsert({
          tenant_id: tenantId,
          ml_order_id: orderData.id,
          ml_item_id: item.item.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_amount: orderData.total_amount,
          date_created: orderData.date_created,
          order_status: orderData.status,
        }, {
          onConflict: 'tenant_id,ml_order_id,ml_item_id',
        });
    }

  } catch (error) {
    console.error('Error processing order webhook:', error);
  }
}

async function processItemWebhook(
  supabase: any,
  tenantId: string,
  payload: MLWebhookPayload
) {
  console.log('Processing item webhook for tenant:', tenantId);
  
  try {
    // Get ML auth token
    const { data: authToken, error: authError } = await supabase
      .from('ml_auth_tokens')
      .select('access_token')
      .eq('tenant_id', tenantId)
      .single();

    if (authError || !authToken) {
      throw new Error('ML auth token not found');
    }

    // Fetch item details from ML API
    const itemResponse = await fetch(`https://api.mercadolibre.com${payload.resource}`, {
      headers: {
        'Authorization': `Bearer ${authToken.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!itemResponse.ok) {
      throw new Error(`Failed to fetch item: ${itemResponse.status}`);
    }

    const itemData = await itemResponse.json();

    // Update local product mapping
    await supabase
      .from('ml_product_mapping')
      .update({
        ml_title: itemData.title,
        ml_price: itemData.price,
        sync_status: 'synced',
        last_sync_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
      .eq('ml_item_id', itemData.id);

  } catch (error) {
    console.error('Error processing item webhook:', error);
  }
}