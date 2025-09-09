import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { mlAuthSchema } from '../shared/schemas.ts';
import { z } from "zod";
import { setupLogger } from '../shared/logger.ts';
import { corsHeaders, handleCors } from '../shared/cors.ts';

// PKCE Helper Functions - Compatível com Deno
async function generateRandomString(length: number): Promise<string> {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, x => charset[x % charset.length]).join('');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return await crypto.subtle.digest('SHA-256', data);
}

function base64URLEncode(buffer: ArrayBuffer): string {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const codeVerifier = await generateRandomString(128);
  const challengeBuffer = await sha256(codeVerifier);
  const codeChallenge = base64URLEncode(challengeBuffer);

  return { codeVerifier, codeChallenge };
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    setupLogger(req.headers);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mlClientId = Deno.env.get('MELI_CLIENT_ID')!;
    const mlClientSecret = Deno.env.get('MELI_CLIENT_SECRET')!;

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

    // Get user's tenant_id using RPC to bypass RLS
    console.log('Getting tenant_id for user:', user.id);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile query error:', profileError);
      return errorResponse(`Profile access error: ${profileError.message}`, 500);
    }

    if (!profile) {
      console.error('No profile found for user:', user.id);
      return errorResponse('User profile not found', 404);
    }

    const tenantId = profile.tenant_id;
    console.log('Successfully retrieved tenant_id:', tenantId);

    // Tentar ler body JSON
    let body: z.infer<typeof mlAuthSchema>;
    try {
      const bodyText = await req.text();
      const json = bodyText ? JSON.parse(bodyText) : {};
      body = mlAuthSchema.parse(json);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return errorResponse('Invalid request body', 400);
    }

    switch (body.action) {
      case 'start_auth': {
        try {
          // Limpar PKCE expirados antes de criar novo
          await supabase.rpc('cleanup_expired_pkce');

          // Gerar PKCE
          const { codeVerifier, codeChallenge } = await generatePKCE();
          const redirectUri = Deno.env.get('MELI_REDIRECT_URI') || 'https://peepers-hub.lovable.app/integrations/mercado-livre/callback';
          const state = `${tenantId}_${Date.now()}_${crypto.randomUUID()}`;

          // Armazenar PKCE na base de dados
          const { error: pkceError } = await supabase
            .from('ml_pkce_storage')
            .insert({
              tenant_id: tenantId,
              state,
              code_verifier: codeVerifier,
              code_challenge: codeChallenge,
              code_challenge_method: 'S256'
            });

          if (pkceError) {
            console.error('PKCE Storage Error:', pkceError);
            throw new Error('Failed to store PKCE data');
          }

          // Gerar URL OAuth com PKCE
          const authUrl = new URL('https://auth.mercadolivre.com.br/authorization');
          authUrl.searchParams.set('response_type', 'code');
          authUrl.searchParams.set('client_id', mlClientId);
          authUrl.searchParams.set('redirect_uri', redirectUri);
          authUrl.searchParams.set('state', state);
          authUrl.searchParams.set('code_challenge', codeChallenge);
          authUrl.searchParams.set('code_challenge_method', 'S256');

          console.log('Generated OAuth URL with PKCE:', authUrl.toString());

          // Log da operação
          await supabase
            .from('ml_sync_log')
            .insert({
              tenant_id: tenantId,
              operation_type: 'start_auth',
              entity_type: 'auth',
              status: 'success',
              request_data: { state, has_pkce: true },
              request_url: authUrl.toString()
            });

          return new Response(
            JSON.stringify({ auth_url: authUrl.toString(), state }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Start Auth Error:', error);

          // Log do erro
          await supabase
            .from('ml_sync_log')
            .insert({
              tenant_id: tenantId,
              operation_type: 'start_auth',
              entity_type: 'auth',
              status: 'error',
              error_details: { message: error.message, stack: error.stack }
            });

          throw error;
        }
      }

      case 'handle_callback': {
        try {
          if (!body.code || !body.state) {
            return errorResponse('Missing authorization code or state', 400);
          }

          // Verificar state contém tenant_id
          if (!body.state.startsWith(tenantId)) {
            return errorResponse('Invalid state parameter', 400);
          }

          // Buscar PKCE data
          const { data: pkceData, error: pkceError } = await supabase
            .from('ml_pkce_storage')
            .select('*')
            .eq('state', body.state)
            .eq('tenant_id', tenantId)
            .single();

          if (pkceError || !pkceData) {
            console.error('PKCE Data Error:', pkceError);
            throw new Error('PKCE verification failed - invalid or expired state');
          }

          // Verificar se não expirou
          if (new Date(pkceData.expires_at) <= new Date()) {
            throw new Error('PKCE data expired');
          }

          console.log('Using PKCE code_verifier for token exchange');

          // Trocar código por token com PKCE
          const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: mlClientId,
            client_secret: mlClientSecret,
            code: body.code,
            redirect_uri: Deno.env.get('MELI_REDIRECT_URI') || 'https://peepers-hub.lovable.app/integrations/mercado-livre/callback',
            code_verifier: pkceData.code_verifier, // CRÍTICO: Incluir code_verifier
          });

          const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json',
            },
            body: tokenParams,
          });

          const tokenResponseText = await tokenResponse.text();
          console.log('ML Token Response Status:', tokenResponse.status);
          console.log('ML Token Response Body:', tokenResponseText);

          if (!tokenResponse.ok) {
            console.error('ML Token Exchange Error:', tokenResponseText);

            // Log detalhado do erro
            await supabase
              .from('ml_sync_log')
              .insert({
                tenant_id: tenantId,
                operation_type: 'handle_callback',
                entity_type: 'auth',
                status: 'error',
                request_data: { code: body.code, state: body.state, has_pkce: true },
                response_data: { error: tokenResponseText, status: tokenResponse.status },
                response_status: tokenResponse.status,
                request_url: 'https://api.mercadolibre.com/oauth/token'
              });

            throw new Error(`Failed to exchange authorization code: ${tokenResponseText}`);
          }

          const tokenData = JSON.parse(tokenResponseText);

          // Limpar PKCE data após uso bem-sucedido
          await supabase
            .from('ml_pkce_storage')
            .delete()
            .eq('state', body.state);

          console.log('Token exchange successful, fetching user info...');

          // Obter informações do usuário ML
          const userResponse = await fetch('https://api.mercadolibre.com/users/me', {
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
            },
          });

          if (!userResponse.ok) {
            const userErrorText = await userResponse.text();
            console.error('ML User Info Error:', userErrorText);
            throw new Error(`Failed to get user info from Mercado Livre: ${userErrorText}`);
          }

          const mlUser = await userResponse.json();
          console.log('ML User Info:', { id: mlUser.id, nickname: mlUser.nickname });

          // Calcular tempo de expiração
          const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

          // Armazenar token na base de dados
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
              ml_nickname: mlUser.nickname,
            }, {
              onConflict: 'tenant_id',
            });

          if (insertError) {
            console.error('Database Insert Error:', insertError);
            throw new Error('Failed to store authentication token');
          }

          // Criar configurações padrão de sincronização
          await supabase.rpc('create_default_ml_settings', { p_tenant_id: tenantId });

          // Log de autenticação bem-sucedida
          await supabase
            .from('ml_sync_log')
            .insert({
              tenant_id: tenantId,
              operation_type: 'auth_success',
              entity_type: 'auth',
              status: 'success',
              response_data: { user_id_ml: mlUser.id, scope: tokenData.scope },
              request_url: 'https://api.mercadolibre.com/users/me',
              response_status: userResponse.status
            });

          console.log('ML Auth completed successfully for tenant:', tenantId);

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

        } catch (error) {
          console.error('Handle Callback Error:', error);

          // Log detalhado do erro
          await supabase
            .from('ml_sync_log')
            .insert({
              tenant_id: tenantId,
              operation_type: 'handle_callback',
              entity_type: 'auth',
              status: 'error',
              error_details: { message: error.message, stack: error.stack },
              request_data: { code: body.code, state: body.state }
            });

          throw error;
        }
      }

      case 'refresh_token': {
        // Get current token
        const { data: currentToken, error: tokenError } = await supabase
          .from('ml_auth_tokens_decrypted')
          .select('*')
          .eq('tenant_id', tenantId)
          .single();

        if (tokenError || !currentToken) {
          return errorResponse('No authentication token found', 404);
        }

        if (!currentToken.refresh_token) {
          return errorResponse('No refresh token available', 400);
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

          // Log detalhado do erro de refresh
          await supabase
            .from('ml_sync_log')
            .insert({
              tenant_id: tenantId,
              operation_type: 'refresh_token',
              entity_type: 'auth',
              status: 'error',
              error_details: { message: errorText, status: refreshResponse.status },
              request_url: 'https://api.mercadolibre.com/oauth/token',
              response_status: refreshResponse.status
            });

          throw new Error(`Failed to refresh token: ${errorText}`);
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

        // Log de refresh bem-sucedido
        await supabase
          .from('ml_sync_log')
          .insert({
            tenant_id: tenantId,
            operation_type: 'refresh_token',
            entity_type: 'auth',
            status: 'success',
            response_data: { expires_at: newExpiresAt.toISOString() },
            request_url: 'https://api.mercadolibre.com/oauth/token',
            response_status: refreshResponse.status
          });

        return new Response(
          JSON.stringify({ success: true, expires_at: newExpiresAt.toISOString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_status': {
        // Get current auth status
        const { data: token, error: tokenError } = await supabase
          .from('ml_auth_tokens_decrypted')
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

        // Auto-recuperação de nickname se estiver NULL
        let nickname = token.ml_nickname;
        if (!nickname && token.access_token && !isExpired) {
          try {
            console.log('Auto-recuperando ml_nickname para tenant:', tenantId);

            const mlUserResponse = await fetch('https://api.mercadolibre.com/users/me', {
              headers: {
                'Authorization': `Bearer ${token.access_token}`,
                'Content-Type': 'application/json',
              },
            });

            if (mlUserResponse.ok) {
              const mlUser = await mlUserResponse.json();
              nickname = mlUser.nickname;

              // Atualizar no banco
              await supabase
                .from('ml_auth_tokens')
                .update({ ml_nickname: nickname })
                .eq('tenant_id', tenantId);

              console.log('Nickname recuperado e atualizado:', nickname);
            }
          } catch (error) {
            console.error('Erro na auto-recuperação do nickname:', error);
          }
        }

        return new Response(
          JSON.stringify({
            connected: !isExpired,
            status,
            expires_at: token.expires_at,
            user_id_ml: token.user_id_ml,
            ml_nickname: nickname,
            scope: token.scope
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'disconnect': {
        // Desconectar/remover tokens do ML
        console.log('Disconnecting ML for tenant:', tenantId);

        const { error: deleteError } = await supabase
          .from('ml_auth_tokens')
          .delete()
          .eq('tenant_id', tenantId);

        if (deleteError) {
          return errorResponse('Failed to disconnect', 500);
        }

        // Log da desconexão
        await supabase.from('ml_sync_log').insert({
          tenant_id: tenantId,
          operation_type: 'disconnect',
          entity_type: 'auth',
          status: 'success',
          response_data: { disconnected_at: new Date().toISOString() }
        });

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return errorResponse('Invalid action', 400);
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
