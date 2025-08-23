import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook payload
    const payload = await req.json();
    
    console.log('ML Webhook received:', payload);

    // Extract webhook data
    const { topic, resource, user_id, application_id } = payload;

    if (!topic || !resource || !user_id || !application_id) {
      throw new Error('Invalid webhook payload');
    }

    // Find tenant by ML user_id
    const { data: authToken, error: authError } = await supabase
      .from('ml_auth_tokens')
      .select('tenant_id, access_token')
      .eq('user_id_ml', user_id)
      .single();

    if (authError || !authToken) {
      console.log('No tenant found for ML user_id:', user_id);
      return new Response('OK', { status: 200 });
    }

    const tenantId = authToken.tenant_id;

    // Store webhook event
    const { data: webhookEvent, error: webhookError } = await supabase
      .from('ml_webhook_events')
      .insert({
        tenant_id: tenantId,
        topic,
        resource,
        user_id_ml: user_id,
        application_id,
        raw_payload: payload,
      })
      .select()
      .single();

    if (webhookError) {
      console.error('Failed to store webhook event:', webhookError);
      throw new Error('Failed to store webhook event');
    }

    // Process webhook based on topic
    try {
      switch (topic) {
        case 'orders':
          await processOrderWebhook(supabase, tenantId, resource, authToken.access_token, webhookEvent.id);
          break;
        case 'items':
          await processItemWebhook(supabase, tenantId, resource, authToken.access_token, webhookEvent.id);
          break;
        case 'questions':
          await processQuestionWebhook(supabase, tenantId, resource, authToken.access_token, webhookEvent.id);
          break;
        default:
          console.log('Unhandled webhook topic:', topic);
      }

      // Mark webhook as processed
      await supabase
        .from('ml_webhook_events')
        .update({ processed_at: new Date().toISOString() })
        .eq('id', webhookEvent.id);

    } catch (processingError) {
      console.error('Webhook processing error:', processingError);
      
      // Update webhook with error
      await supabase
        .from('ml_webhook_events')
        .update({ 
          error_message: processingError.message,
          attempts: 1 
        })
        .eq('id', webhookEvent.id);
    }

    return new Response('OK', { status: 200 });

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
  resource: string, 
  accessToken: string, 
  webhookEventId: string
) {
  console.log('Processing order webhook:', resource);

  // Extract order ID from resource URL
  const orderIdMatch = resource.match(/orders\/(\d+)/);
  if (!orderIdMatch) {
    throw new Error('Could not extract order ID from resource URL');
  }

  const orderId = orderIdMatch[1];

  // Fetch order details from ML API
  const orderResponse = await fetch(`https://api.mercadolibre.com/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!orderResponse.ok) {
    throw new Error(`Failed to fetch order details: ${orderResponse.status}`);
  }

  const orderData = await orderResponse.json();

  // Process each item in the order
  for (const item of orderData.order_items) {
    try {
      // Find local product mapping
      const { data: mapping, error: mappingError } = await supabase
        .from('ml_product_mapping')
        .select('product_id')
        .eq('tenant_id', tenantId)
        .eq('ml_item_id', item.item.id)
        .single();

      // Store order even if product mapping is not found
      const orderItem = {
        tenant_id: tenantId,
        ml_order_id: parseInt(orderId),
        ml_item_id: item.item.id,
        product_id: mapping?.product_id || null,
        buyer_id: orderData.buyer.id,
        buyer_nickname: orderData.buyer.nickname,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_amount: orderData.total_amount,
        currency_id: orderData.currency_id,
        order_status: orderData.status,
        payment_status: orderData.payments?.[0]?.status,
        shipping_status: orderData.shipping?.status,
        date_created: orderData.date_created,
        date_closed: orderData.date_closed,
        date_last_updated: orderData.last_updated,
        fees: orderData.fees || {},
        shipping_info: orderData.shipping || {},
      };

      // Upsert order
      await supabase
        .from('ml_orders')
        .upsert(orderItem, {
          onConflict: 'tenant_id,ml_order_id,ml_item_id',
        });

      // If we have a product mapping, also create a sale record
      if (mapping?.product_id) {
        await supabase
          .from('sales')
          .upsert({
            tenant_id: tenantId,
            product_id: mapping.product_id,
            marketplace_id: null, // TODO: Get ML marketplace ID
            price_charged: item.unit_price,
            quantity: item.quantity,
            sold_at: orderData.date_created,
          }, {
            onConflict: 'tenant_id,product_id,sold_at', // Prevent duplicates
          });
      }

      // Log successful processing
      await supabase
        .from('ml_sync_log')
        .insert({
          tenant_id: tenantId,
          operation_type: 'webhook_order',
          entity_type: 'order',
          entity_id: mapping?.product_id,
          ml_entity_id: orderId,
          status: 'success',
          response_data: orderData,
        });

    } catch (itemError) {
      console.error('Error processing order item:', itemError);
      
      // Log error for this specific item
      await supabase
        .from('ml_sync_log')
        .insert({
          tenant_id: tenantId,
          operation_type: 'webhook_order',
          entity_type: 'order',
          ml_entity_id: orderId,
          status: 'error',
          error_details: { message: itemError.message, item_id: item.item.id },
        });
    }
  }
}

async function processItemWebhook(
  supabase: any, 
  tenantId: string, 
  resource: string, 
  accessToken: string, 
  webhookEventId: string
) {
  console.log('Processing item webhook:', resource);

  // Extract item ID from resource URL
  const itemIdMatch = resource.match(/items\/([A-Z0-9]+)/);
  if (!itemIdMatch) {
    throw new Error('Could not extract item ID from resource URL');
  }

  const itemId = itemIdMatch[1];

  // Find local product mapping
  const { data: mapping, error: mappingError } = await supabase
    .from('ml_product_mapping')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('ml_item_id', itemId)
    .single();

  if (mappingError || !mapping) {
    console.log('No product mapping found for ML item:', itemId);
    return;
  }

  // Fetch updated item details from ML API
  const itemResponse = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!itemResponse.ok) {
    throw new Error(`Failed to fetch item details: ${itemResponse.status}`);
  }

  const itemData = await itemResponse.json();

  // Update local mapping with new data
  await supabase
    .from('ml_product_mapping')
    .update({
      ml_title: itemData.title,
      ml_price: itemData.price,
      ml_permalink: itemData.permalink,
      last_sync_at: new Date().toISOString(),
    })
    .eq('id', mapping.id);

  // Log the update
  await supabase
    .from('ml_sync_log')
    .insert({
      tenant_id: tenantId,
      operation_type: 'webhook_item',
      entity_type: 'product',
      entity_id: mapping.product_id,
      ml_entity_id: itemId,
      status: 'success',
      response_data: itemData,
    });
}

async function processQuestionWebhook(
  supabase: any, 
  tenantId: string, 
  resource: string, 
  accessToken: string, 
  webhookEventId: string
) {
  console.log('Processing question webhook:', resource);

  // Extract question ID from resource URL
  const questionIdMatch = resource.match(/questions\/(\d+)/);
  if (!questionIdMatch) {
    throw new Error('Could not extract question ID from resource URL');
  }

  const questionId = questionIdMatch[1];

  // Fetch question details from ML API
  const questionResponse = await fetch(`https://api.mercadolibre.com/questions/${questionId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!questionResponse.ok) {
    throw new Error(`Failed to fetch question details: ${questionResponse.status}`);
  }

  const questionData = await questionResponse.json();

  // Log the question for now (could implement notification system later)
  await supabase
    .from('ml_sync_log')
    .insert({
      tenant_id: tenantId,
      operation_type: 'webhook_question',
      entity_type: 'question',
      ml_entity_id: questionId,
      status: 'success',
      response_data: questionData,
    });

  console.log('New question received:', {
    item_id: questionData.item_id,
    question: questionData.text,
    from_user: questionData.from.id,
  });
}