import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";
import { updateProductFromItem, type ItemData } from './updateProductFromItem.ts';
import { mlWebhookSchema } from '../shared/schemas.ts';
import { setupLogger, logger } from '../shared/logger.ts';
import { corsHeaders, handleCors } from '../shared/cors.ts';
import { verifySignature } from './verifySignature.ts';

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
  const requestId = crypto.randomUUID();
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  setupLogger(req.headers);
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('X-Hub-Signature');
    const secret = Deno.env.get('MELI_WEBHOOK_SECRET')!;
    const isValid = await verifySignature(rawBody, signature, secret);
    if (!isValid) {
      logger.error('Invalid ML webhook signature', undefined, { requestId, action: 'verify-signature' });
      return new Response('Invalid webhook signature', {
        status: 401,
        headers: corsHeaders,
      });
    }

    const payload = mlWebhookSchema.parse(JSON.parse(rawBody));
    logger.info('Received ML webhook', { requestId, action: 'parse-webhook', topic: payload.topic });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find tenant by ML user ID
    const { data: tenantData, error: tenantError } = await supabase
      .rpc('get_tenant_by_ml_user_id', { p_user_id_ml: payload.user_id });

    if (tenantError || !tenantData) {
      logger.error('Tenant not found for ML user', undefined, { requestId, action: 'lookup-tenant', userId: payload.user_id });
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
      logger.error('Failed to log webhook event', undefined, { requestId, tenantId, action: 'log-webhook', error: logError });
    }

    // Process webhook based on topic
    let result: { updatedFields?: string[]; error?: Error } | undefined;
    switch (payload.topic) {
      case 'orders_v2':
        result = await processOrderWebhook(supabase, tenantId, payload, requestId);
        break;

      case 'items':
        result = await processItemWebhook(supabase, tenantId, payload, requestId);
        break;

      default:
        logger.warn('Unhandled webhook topic', { requestId, tenantId, action: 'handle-webhook', topic: payload.topic });
    }

    // Mark webhook as processed with results
    await supabase
      .from('ml_webhook_events')
      .update({
        processed_at: new Date().toISOString(),
        updated_fields: result?.updatedFields || null,
        error_details: result?.error
          ? { message: result.error.message, stack: result.error.stack }
          : null,
      })
      .eq('tenant_id', tenantId)
      .eq('resource', payload.resource)
      .eq('topic', payload.topic);

    return new Response('OK', { 
      status: 200,
      headers: corsHeaders 
    });

  } catch (error) {
    logger.error('ML Webhook Error', error as Error, { requestId, action: 'webhook-handler' });
    
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
  supabase: SupabaseClient,
  tenantId: string,
  payload: MLWebhookPayload,
  requestId: string
): Promise<{ error?: Error }> {
  logger.info('Processing order webhook for tenant', { requestId, tenantId, action: 'process-order' });

  try {
    // Get ML auth token for this tenant
    const { data: authToken, error: authError } = await supabase
      .from('ml_auth_tokens_decrypted')
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

    return {};

  } catch (error) {
    logger.error('Error processing order webhook', error as Error, { requestId, tenantId, action: 'process-order' });
    return { error: error as Error };
  }
}

async function processItemWebhook(
  supabase: SupabaseClient,
  tenantId: string,
  payload: MLWebhookPayload,
  requestId: string
): Promise<{ updatedFields?: string[]; error?: Error }> {
  logger.info('Processing item webhook for tenant', { requestId, tenantId, action: 'process-item' });

  try {
    // Get ML auth token
    const { data: authToken, error: authError } = await supabase
      .from('ml_auth_tokens_decrypted')
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

    const itemData: ItemData = await itemResponse.json();

    const updatedFields = await updateProductFromItem(
      supabase,
      tenantId,
      itemData,
      authToken.access_token
    );

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

    return { updatedFields };

  } catch (error) {
    logger.error('Error processing item webhook', error as Error, { requestId, tenantId, action: 'process-item' });
    return { error: error as Error };
  }
}