import { SupabaseClient } from '@supabase/supabase-js';
import { MLAuthToken, mlAuthTokenSchema, MLError } from '@/types/mercado-livre';

export class MLRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getAuthToken(tenantId: string): Promise<MLAuthToken> {
    const { data, error } = await this.supabase
      .from('ml_auth_tokens_decrypted')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      throw new MLError(`Failed to get ML auth token: ${error.message}`, 401);
    }

    try {
      return mlAuthTokenSchema.parse(data);
    } catch (error) {
      throw new MLError('Invalid ML auth token format', 500);
    }
  }

  async validateToken(authToken: MLAuthToken): Promise<void> {
    if (new Date(authToken.expires_at) <= new Date()) {
      throw new MLError('ML token expired', 401);
    }
  }

  async validateJWT(jwt: string): Promise<{ userId: string; tenantId: string }> {
    const { data: { user }, error: userError } = await this.supabase.auth.getUser(jwt);
    if (userError || !user) {
      throw new MLError('Invalid authorization token', 401);
    }

    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile?.tenant_id) {
      throw new MLError('User profile not found', 404);
    }

    return {
      userId: user.id,
      tenantId: profile.tenant_id
    };
  }
}
