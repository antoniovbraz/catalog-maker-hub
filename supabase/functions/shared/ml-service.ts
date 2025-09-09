/* eslint-disable @typescript-eslint/no-explicit-any */
// Shared ML Service Layer - Implementa princípios SOLID e DRY
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from './cors.ts'
import { fetchWithRetry } from './fetchWithRetry.ts'

// Types e Interfaces
export interface MLAuthData {
  access_token: string;
  refresh_token?: string;
  expires_at: string;
  user_id_ml?: number;
  ml_nickname?: string;
  scope?: string;
}

export interface MLSyncRequest {
  action: 'sync_product' | 'sync_batch' | 'import_from_ml' | 'get_sync_status' | 'link_product' | 'create_ad';
  product_ids?: string[];
  product_id?: string;
  ml_item_id?: string;
  ad_data?: any;
}

export interface MLApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  status_code?: number;
}

// Service principal para operações do Mercado Livre
export class MLService {
  private supabase: any;
  private accessToken: string;
  private tenantId: string;

  constructor(supabaseUrl: string, serviceKey: string) {
    this.supabase = createClient(supabaseUrl, serviceKey);
  }

  // Autenticação e validação de token
  async validateAuth(request: Request): Promise<{ tenantId: string; userId: string } | null> {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return null;

    const { data: { user }, error } = await this.supabase.auth.getUser(token);
    if (error || !user) return null;

    const { data: profile } = await this.supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) return null;

    return { tenantId: profile.tenant_id, userId: user.id };
  }

  // Buscar token ML ativo para tenant
  async getMLToken(tenantId: string): Promise<string | null> {
    const { data: tokenData, error } = await this.supabase
      .from('ml_auth_tokens_decrypted')
      .select('access_token, expires_at')
      .eq('tenant_id', tenantId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !tokenData) {
      console.error('ML token not found or expired:', error);
      return null;
    }

    return tokenData.access_token;
  }

  // Rate limiting check
  async checkRateLimit(tenantId: string, operationType: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('check_ml_rate_limit', {
      p_operation_type: operationType
    });

    if (error) {
      console.warn('Rate limit check failed:', error);
      return true; // Allow operation if check fails
    }

    return data;
  }

  // Log operação
  async logOperation(
    tenantId: string,
    operationType: string,
    entityType: string,
    status: 'success' | 'error',
    entityId?: string,
    mlEntityId?: string,
    requestData?: any,
    responseData?: any,
    errorDetails?: any,
    executionTimeMs?: number
  ): Promise<void> {
    try {
      await this.supabase.from('ml_sync_log').insert({
        tenant_id: tenantId,
        operation_type: operationType,
        entity_type: entityType,
        status,
        entity_id: entityId,
        ml_entity_id: mlEntityId,
        request_data: requestData,
        response_data: responseData,
        error_details: errorDetails,
        execution_time_ms: executionTimeMs
      });
    } catch (error) {
      console.error('Failed to log operation:', error);
    }
  }

  // Chamada para API do ML com retry e timeout
  async callMLAPI(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    timeout: number = 30000
  ): Promise<MLApiResponse> {
    try {
      const response = await fetchWithRetry(`https://api.mercadolibre.com${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      }, { timeoutMs: timeout });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: responseData.message || `ML API error: ${response.status}`,
          status_code: response.status,
          data: responseData
        };
      }

      return {
        success: true,
        data: responseData,
        status_code: response.status
      };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout',
          status_code: 408
        };
      }

      return {
        success: false,
        error: (error as Error).message,
        status_code: 500
      };
    }
  }

  // Validação de dados antes de enviar para ML
  validateProductData(product: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!product.name || product.name.trim().length < 3) {
      errors.push('Nome do produto deve ter pelo menos 3 caracteres');
    }

    if (!product.cost_unit || product.cost_unit <= 0) {
      errors.push('Custo unitário deve ser maior que zero');
    }

    if (product.name && product.name.length > 60) {
      errors.push('Nome do produto deve ter no máximo 60 caracteres');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Mapear produto local para formato ML
  mapProductToML(product: any, mlCategoryId?: string): any {
    return {
      title: product.name,
      category_id: mlCategoryId || 'MLB1648', // Categoria padrão se não especificada
      price: product.cost_unit * 1.3, // Markup padrão de 30%
      currency_id: 'BRL',
      available_quantity: 1,
      buying_mode: 'buy_it_now',
      listing_type_id: 'gold_special',
      condition: 'new',
      description: {
        plain_text: product.description || `Produto: ${product.name}`
      },
      seller_custom_field: product.sku
    };
  }

  // Error handler padronizado
  handleError(error: any, operation: string): Response {
    console.error(`Error in ${operation}:`, error);

    const errorResponse = {
      error: error.message || 'Internal server error',
      operation,
      timestamp: new Date().toISOString()
    };

    const statusCode = error.status_code || 500;

    return new Response(JSON.stringify(errorResponse), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Response helper padronizado
  createResponse(data: any, status: number = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Inicializar service com token
  async initialize(tenantId: string): Promise<boolean> {
    this.tenantId = tenantId;
    this.accessToken = await this.getMLToken(tenantId);
    return !!this.accessToken;
  }
}

// Middleware de autenticação
export async function withAuth(
  request: Request,
  handler: (authData: { tenantId: string; userId: string }) => Promise<Response>
): Promise<Response> {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const mlService = new MLService(supabaseUrl, serviceKey);
  const authData = await mlService.validateAuth(request);

  if (!authData) {
    return mlService.createResponse({ error: 'Unauthorized' }, 401);
  }

  return handler(authData);
}