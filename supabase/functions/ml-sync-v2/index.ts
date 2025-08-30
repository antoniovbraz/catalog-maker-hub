import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  SyncRequest,
  ActionContext,
  corsHeaders,
  errorResponse,
} from './types.ts';
import { getStatus } from './actions/getStatus.ts';
import { syncProduct } from './actions/syncProduct.ts';
import { syncBatch } from './actions/syncBatch.ts';
import { importFromML } from './actions/importFromML.ts';
import { linkProduct } from './actions/linkProduct.ts';
import { getProducts } from './actions/getProducts.ts';
import { createAd } from './actions/createAd.ts';
import { resyncProduct } from './actions/resyncProduct.ts';

type Handler = (req: any, ctx: ActionContext) => Promise<Response>;
const actions: Record<string, Handler> = {
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      body = bodyText ? JSON.parse(bodyText) : ({ action: 'get_status' } as SyncRequest);
    } catch (error) {
      console.error('Error parsing request body:', error);
      body = { action: 'get_status' } as SyncRequest;
    }

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

    const context: ActionContext = {
      supabase,
      tenantId,
      authToken,
      mlClientId,
      mlToken: authToken.access_token,
    };

    const handler = actions[body.action];
    if (!handler) {
      return errorResponse('Invalid action', 400);
    }

    return await handler(body as any, context);
  } catch (error) {
    console.error('ML Sync Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
