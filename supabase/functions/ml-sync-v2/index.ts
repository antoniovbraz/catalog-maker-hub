import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  SyncRequest,
  ActionContext,
  errorResponse,
} from './types.ts';
import { corsHeaders, handleCors } from '../shared/cors.ts';
import { mlSyncRequestSchema } from '../shared/schemas.ts';
import { getStatus } from './actions/getStatus.ts';
import { syncProduct } from './actions/syncProduct.ts';
import { syncBatch } from './actions/syncBatch.ts';
import { importFromML } from './actions/importFromML.ts';
import { linkProduct } from './actions/linkProduct.ts';
import { getProducts } from './actions/getProducts.ts';
import { createAd } from './actions/createAd.ts';
import { resyncProduct } from './actions/resyncProduct.ts';
import { setupLogger } from '../shared/logger.ts';

type Handler = (req: SyncRequest, ctx: ActionContext) => Promise<Response>;
const actions: Record<SyncRequest['action'], Handler> = {
  get_status: getStatus,
  sync_product: syncProduct,
  sync_batch: syncBatch,
  import_from_ml: importFromML,
  link_product: linkProduct,
  get_products: getProducts,
  create_ad: createAd,
  resync_product: resyncProduct,
};

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    setupLogger(req.headers);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mlClientId = Deno.env.get('ML_CLIENT_ID')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Authorization header required', 401);
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      return errorResponse('Invalid authorization token', 401);
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError || !profile) {
      return errorResponse('User profile not found', 404);
    }
    const tenantId = profile.tenant_id;

    let body: SyncRequest;
    try {
      const bodyText = await req.text();
      const json = bodyText ? JSON.parse(bodyText) : {};
      body = mlSyncRequestSchema.parse(json) as SyncRequest;
    } catch (error) {
      console.error('Error parsing request body:', error);
      body = mlSyncRequestSchema.parse({ action: 'get_status' });
    }

    const { data: authToken, error: authError } = await supabase
      .from('ml_auth_tokens_decrypted')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();
    if (authError) {
      console.error('ML auth token error:', authError);
      return errorResponse(`ML authentication required: ${authError.message}`, 401);
    }
    if (!authToken) {
      console.error('No auth token found for tenant:', tenantId);
      return errorResponse('ML authentication required: No token found', 401);
    }
    if (new Date(authToken.expires_at) <= new Date()) {
      console.error('Token expired at:', authToken.expires_at);
      return errorResponse('ML token expired', 401);
    }

    const context: ActionContext = {
      supabase,
      tenantId,
      authToken,
      mlClientId,
      mlToken: authToken.access_token,
      jwt,
    };

    const handler = actions[body.action];
    if (!handler) {
      return errorResponse('Invalid action', 400);
    }

    return await handler(body, context);
  } catch (error) {
    console.error('ML Sync Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
