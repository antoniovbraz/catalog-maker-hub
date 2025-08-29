import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthRequest {
  action: 'start_auth' | 'handle_callback' | 'refresh_token' | 'get_status';
  code?: string;
  state?: string;
  tenant_id?: string;
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
    const mlClientSecret = Deno.env.get('ML_CLIENT_SECRET')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Verify JWT and get user
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      throw new Error('Invalid authorization token');
    }

    // Get user's tenant_id using RPC to bypass RLS
    console.log('Getting tenant_id for user:', user.id);
    
    let tenantId: string;
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile query error:', profileError);
        throw new Error(`Profile access error: ${profileError.message}`);
      }

      if (!profile) {
        console.error('No profile found for user:', user.id);
        throw new Error('User profile not found');
      }

      tenantId = profile.tenant_id;
      console.log('Successfully retrieved tenant_id:', tenantId);
    } catch (error) {
      console.error('Error getting tenant_id:', error);
      throw new Error(`Failed to get user tenant: ${error.message}`);
    }
    const body: AuthRequest = await req.json();

    switch (body.action) {
      case 'start_auth': {
        // Generate OAuth URL for Mercado Livre
        const redirectUri = Deno.env.get('ML_REDIRECT_URL') || 'https://peepers-hub.lovable.app/integrations/mercado-livre/callback';
        const state = `${tenantId}_${Date.now()}`;
        
        const authUrl = new URL('https://auth.mercadolivre.com.br/authorization');
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('client_id', mlClientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('state', state);
        
        return new Response(
          JSON.stringify({ auth_url: authUrl.toString(), state }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'handle_callback': {
        if (!body.code || !body.state) {
          throw new Error('Missing authorization code or state');
        }

        // Verify state contains tenant_id
        if (!body.state.startsWith(tenantId)) {
          throw new Error('Invalid state parameter');
        }

        // Exchange code for access token
        const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: mlClientId,
            client_secret: mlClientSecret,
            code: body.code,
            redirect_uri: Deno.env.get('ML_REDIRECT_URL') || 'https://peepers-hub.lovable.app/integrations/mercado-livre/callback',
          }),
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('ML Token Exchange Error:', errorText);
          throw new Error('Failed to exchange authorization code');
        }

        const tokenData = await tokenResponse.json();

        // Get user info from ML
        const userResponse = await fetch('https://api.mercadolibre.com/users/me', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error('Failed to get user info from Mercado Livre');
        }

        const mlUser = await userResponse.json();

        // Calculate expiration time
        const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

        // Store token in database
        const { error: insertError } = await supabase
          .from('ml_auth_tokens')
          .upsert({
            tenant_id: tenantId,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_type: tokenData.token_type || 'Bearer',
            expires_at: expiresAt.toISOString(),
            scope: tokenData.scope,
            user_id_ml: mlUser.id,
          }, {
            onConflict: 'tenant_id',
          });

        if (insertError) {
          console.error('Database Insert Error:', insertError);
          throw new Error('Failed to store authentication token');
        }

        // Create default sync settings
        await supabase.rpc('create_default_ml_settings', { p_tenant_id: tenantId });

        // Log successful authentication
        await supabase
          .from('ml_sync_log')
          .insert({
            tenant_id: tenantId,
            operation_type: 'auth_success',
            entity_type: 'auth',
            status: 'success',
            response_data: { user_id_ml: mlUser.id, scope: tokenData.scope },
          });

        return new Response(
          JSON.stringify({ 
            success: true, 
            user_info: { 
              id: mlUser.id, 
              nickname: mlUser.nickname,
              email: mlUser.email 
            } 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'refresh_token': {
        // Get current token
        const { data: currentToken, error: tokenError } = await supabase
          .from('ml_auth_tokens')
          .select('*')
          .eq('tenant_id', tenantId)
          .single();

        if (tokenError || !currentToken) {
          throw new Error('No authentication token found');
        }

        if (!currentToken.refresh_token) {
          throw new Error('No refresh token available');
        }

        // Refresh the token
        const refreshResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: mlClientId,
            client_secret: mlClientSecret,
            refresh_token: currentToken.refresh_token,
          }),
        });

        if (!refreshResponse.ok) {
          const errorText = await refreshResponse.text();
          console.error('ML Token Refresh Error:', errorText);
          throw new Error('Failed to refresh token');
        }

        const newTokenData = await refreshResponse.json();
        const newExpiresAt = new Date(Date.now() + (newTokenData.expires_in * 1000));

        // Update token in database
        const { error: updateError } = await supabase
          .from('ml_auth_tokens')
          .update({
            access_token: newTokenData.access_token,
            refresh_token: newTokenData.refresh_token || currentToken.refresh_token,
            expires_at: newExpiresAt.toISOString(),
            scope: newTokenData.scope || currentToken.scope,
            updated_at: new Date().toISOString(),
          })
          .eq('tenant_id', tenantId);

        if (updateError) {
          console.error('Database Update Error:', updateError);
          throw new Error('Failed to update authentication token');
        }

        return new Response(
          JSON.stringify({ success: true, expires_at: newExpiresAt.toISOString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_status': {
        // Get current auth status
        const { data: token, error: tokenError } = await supabase
          .from('ml_auth_tokens')
          .select('*')
          .eq('tenant_id', tenantId)
          .single();

        if (tokenError) {
          return new Response(
            JSON.stringify({ 
              connected: false, 
              status: 'disconnected' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const isExpired = new Date(token.expires_at) <= new Date();
        const status = isExpired ? 'expired' : 'connected';

        return new Response(
          JSON.stringify({ 
            connected: !isExpired,
            status,
            expires_at: token.expires_at,
            user_id_ml: token.user_id_ml,
            scope: token.scope
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('ML Auth Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});