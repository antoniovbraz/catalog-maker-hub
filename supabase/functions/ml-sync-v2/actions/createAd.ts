import { ActionContext, CreateAdRequest, errorResponse, corsHeaders } from '../types.ts';
import { isMLWriteEnabled } from '../../shared/write-guard.ts';

export async function createAd(
  req: CreateAdRequest,
  { supabase, tenantId }: ActionContext
): Promise<Response> {
  if (!req.ad_data) {
    return errorResponse('Ad data required', 400);
  }

  if (!isMLWriteEnabled()) {
    return errorResponse('ML write operations disabled', 403);
  }

  await supabase
    .from('ml_sync_log')
    .insert({
      tenant_id: tenantId,
      operation_type: 'create_ad',
      entity_type: 'ad',
      status: 'success',
      request_data: req.ad_data,
    });

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Ad creation initiated',
      ad_data: req.ad_data,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
