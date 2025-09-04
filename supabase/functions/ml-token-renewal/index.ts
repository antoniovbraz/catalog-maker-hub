import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { setupLogger } from '../shared/logger.ts';
import { corsHeaders, handleCors } from '../shared/cors.ts';

console.log('ML Token Renewal Service initialized');

async function refreshWithRetry(refreshToken: string, mlClientId: string, mlClientSecret: string) {
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
      console.log(`Retrying token refresh in ${delay}ms due to error:`, error);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  setupLogger(req.headers);
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const mlClientId = Deno.env.get('ML_CLIENT_ID')!;
  const mlClientSecret = Deno.env.get('ML_CLIENT_SECRET')!;

  // Use service role for cron operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('Starting automatic token renewal process...');
    
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
      console.error('Error querying expiring tokens:', queryError);
      throw queryError;
    }

    console.log(`Found ${expiringSoonTokens?.length || 0} tokens expiring soon`);

    let renewedCount = 0;
    let failedCount = 0;

    // Process each token
    for (const token of expiringSoonTokens || []) {
      try {
        console.log(`Renewing token for tenant: ${token.tenant_id}`);

        // Refresh token with retry/backoff
        const tokenData = await refreshWithRetry(token.refresh_token, mlClientId, mlClientSecret);
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
          console.error(`Failed to update token in DB for tenant ${token.tenant_id}:`, updateError);
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
        console.log(`Successfully renewed token for tenant: ${token.tenant_id}`);

      } catch (error) {
        console.error(`Unexpected error renewing token for tenant ${token.tenant_id}:`, error);
        
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
    console.log(`Token renewal completed: ${renewedCount} renewed, ${failedCount} failed`);

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
    console.error('Fatal error in token renewal process:', error);
    
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