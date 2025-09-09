import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { setupLogger, logger } from '../shared/logger.ts';
import { corsHeaders, handleCors } from '../shared/cors.ts';
import { checkEnv } from '../../../edges/_shared/checkEnv.ts';
import { requiredEnv } from '../../../env/required.ts';

logger.info('ML Token Renewal Service initialized');

async function refreshWithRetry(refreshToken: string, mlClientId: string, mlClientSecret: string, requestId: string) {
  const maxRetries = 3;
  const baseDelay = 500; // ms

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: mlClientId,
          client_secret: mlClientSecret,
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, attempt);
      logger.warn('Retrying token refresh', { delay, error, action: 'refresh-token', requestId });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  checkEnv(requiredEnv.edge.mlTokenRenewal);

  setupLogger(req.headers);
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const mlClientId = Deno.env.get('MELI_CLIENT_ID')!;
  const mlClientSecret = Deno.env.get('MELI_CLIENT_SECRET')!;

  // Use service role for cron operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    logger.info('Starting automatic token renewal process', { requestId, action: 'token-renewal' });
    
    // Find tokens that expire in less than 2 hours
    const twoHoursFromNow = new Date();
    twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);

    const { data: expiringSoonTokens, error: queryError } = await supabase
      .from('ml_auth_tokens_decrypted')
      .select('*')
      .lt('expires_at', twoHoursFromNow.toISOString())
      .gt('expires_at', new Date().toISOString()) // Not already expired
      .not('refresh_token', 'is', null); // Has refresh token

    if (queryError) {
      logger.error('Error querying expiring tokens', undefined, { requestId, action: 'token-renewal', error: queryError });
      throw queryError;
    }

    logger.info('Found tokens expiring soon', { requestId, count: expiringSoonTokens?.length || 0, action: 'token-renewal' });

    let renewedCount = 0;
    let failedCount = 0;

    // Process each token
    for (const token of expiringSoonTokens || []) {
      try {
        logger.info('Renewing token for tenant', { requestId, tenantId: token.tenant_id, action: 'token-renewal' });

        // Refresh token with retry/backoff
        const tokenData = await refreshWithRetry(token.refresh_token, mlClientId, mlClientSecret, requestId);
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

        // Update token in database
        const { error: updateError } = await supabase
          .from('ml_auth_tokens')
          .update({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', token.id);

        if (updateError) {
          logger.error('Failed to update token in DB', undefined, { requestId, tenantId: token.tenant_id, action: 'token-renewal', error: updateError });
          failedCount++;
          continue;
        }

        // Log success
        await supabase.from('ml_sync_log').insert({
          tenant_id: token.tenant_id,
          operation_type: 'token_refresh',
          entity_type: 'token',
          status: 'success',
          response_data: { 
            renewed_at: new Date().toISOString(),
            new_expires_at: expiresAt.toISOString()
          },
          response_status: 200
        });

        renewedCount++;
        logger.info('Successfully renewed token for tenant', { requestId, tenantId: token.tenant_id, action: 'token-renewal' });

      } catch (error) {
        logger.error('Unexpected error renewing token', error as Error, { requestId, tenantId: token.tenant_id, action: 'token-renewal' });
        
        // Log unexpected errors
        await supabase.from('ml_sync_log').insert({
          tenant_id: token.tenant_id,
          operation_type: 'token_refresh',
          entity_type: 'token',
          status: 'error',
          error_details: { 
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          }
        });

        failedCount++;
      }
    }

    // Summary log
    logger.info('Token renewal completed', { requestId, renewed: renewedCount, failed: failedCount, action: 'token-renewal' });

    return new Response(
      JSON.stringify({
        success: true,
        renewed: renewedCount,
        failed: failedCount,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    logger.error('Fatal error in token renewal process', error as Error, { requestId, action: 'token-renewal' });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});