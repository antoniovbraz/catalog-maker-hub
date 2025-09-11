import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export interface MLAuthData {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token: string;
}

/**
 * Service responsible only for ML authentication operations
 * Following Single Responsibility Principle
 */
export class MLAuthService {
  static async storeAuthTokens(tenantId: string, authData: MLAuthData, mlNickname?: string) {
    logger.info('MLAuthService.storeAuthTokens', 'Storing ML auth tokens', {
      tenantId,
      userId: authData.user_id,
      scope: authData.scope
    });

    const expiresAt = new Date(Date.now() + authData.expires_in * 1000);

    const { data, error } = await supabase
      .from('ml_auth_tokens')
      .upsert({
        tenant_id: tenantId,
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
        token_type: authData.token_type,
        expires_at: expiresAt.toISOString(),
        user_id_ml: authData.user_id,
        scope: authData.scope,
        ml_nickname: mlNickname || `User-${authData.user_id}`
      }, {
        onConflict: 'tenant_id'
      })
      .select()
      .single();

    if (error) {
      logger.error('MLAuthService.storeAuthTokens', 'Failed to store tokens', {
        tenantId,
        error: error.message
      });
      throw error;
    }

    return data;
  }

  static async getValidToken(tenantId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('ml_auth_tokens')
      .select('access_token, expires_at')
      .eq('tenant_id', tenantId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      logger.warn('MLAuthService.getValidToken', 'No valid token found', {
        tenantId,
        error: error?.message
      });
      return null;
    }

    logger.debug('MLAuthService.getValidToken', 'Valid token retrieved', {
      tenantId,
      expiresAt: data.expires_at
    });

    return data.access_token;
  }

  static async refreshToken(tenantId: string): Promise<string | null> {
    logger.info('MLAuthService.refreshToken', 'Attempting token refresh', { tenantId });

    const { data: tokenData, error: fetchError } = await supabase
      .from('ml_auth_tokens')
      .select('refresh_token')
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !tokenData?.refresh_token) {
      logger.error('MLAuthService.refreshToken', 'No refresh token found', {
        tenantId,
        error: fetchError?.message
      });
      return null;
    }

    try {
      // Call ML API to refresh token
      const response = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: process.env.ML_CLIENT_ID,
          client_secret: process.env.ML_CLIENT_SECRET,
          refresh_token: tokenData.refresh_token,
        }),
      });

      if (!response.ok) {
        logger.error('MLAuthService.refreshToken', 'ML API refresh failed', {
          tenantId,
          status: response.status,
          statusText: response.statusText
        });
        return null;
      }

      const newAuthData: MLAuthData = await response.json();
      await this.storeAuthTokens(tenantId, newAuthData);

      logger.info('MLAuthService.refreshToken', 'Token refreshed successfully', {
        tenantId,
        newExpiresIn: newAuthData.expires_in
      });

      return newAuthData.access_token;
    } catch (error) {
      logger.error('MLAuthService.refreshToken', 'Token refresh error', {
        tenantId,
        error: (error as Error).message
      });
      return null;
    }
  }

  static async disconnectML(tenantId: string): Promise<void> {
    logger.info('MLAuthService.disconnectML', 'Disconnecting ML account', { tenantId });

    const { error } = await supabase
      .from('ml_auth_tokens')
      .delete()
      .eq('tenant_id', tenantId);

    if (error) {
      logger.error('MLAuthService.disconnectML', 'Failed to disconnect', {
        tenantId,
        error: error.message
      });
      throw error;
    }

    logger.info('MLAuthService.disconnectML', 'ML account disconnected successfully', { tenantId });
  }
}