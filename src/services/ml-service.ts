// Frontend ML Service - Centraliza todas as operações ML
import { supabase } from '@/integrations/supabase/client';

// Types e Interfaces
export interface MLSyncStatus {
  total: number;
  synced: number;
  pending: number;
  error: number;
  syncing: number;
}

export interface MLSyncProduct {
  id: string;
  name: string;
  sku?: string;
  ml_item_id?: string;
  sync_status: 'not_synced' | 'syncing' | 'synced' | 'error' | 'pending';
  last_sync_at?: string;
  ml_permalink?: string;
  error_message?: string;
}

export interface MLAuthStatus {
  isConnected: boolean;
  user_id_ml?: number;
  ml_nickname?: string;
  expires_at?: string;
  error?: string;
}

export interface MLPerformanceMetrics {
  total_operations: number;
  successful_operations: number;
  failed_operations: number;
  average_response_time: number;
  success_rate: number;
  operations_by_type: Record<string, number>;
}

export interface MLAdvancedSettings {
  id: string;
  tenant_id: string;
  feature_flags: Record<string, boolean>;
  rate_limits: Record<string, number>;
  auto_recovery_enabled: boolean;
  advanced_monitoring: boolean;
  multi_account_enabled: boolean;
  backup_schedule: string;
  security_level: string;
  created_at: string;
  updated_at: string;
}

// Classe principal do serviço ML
export class MLService {
  // ====== AUTENTICAÇÃO ======
  
  static async getAuthStatus(): Promise<MLAuthStatus> {
    try {
      const { data, error } = await supabase.functions.invoke('ml-auth', {
        body: { action: 'status' }
      });

      if (error) {
        console.error('ML Auth Status Error:', error);
        return { 
          isConnected: false, 
          error: error.message || 'Failed to get auth status' 
        };
      }

      return {
        isConnected: data?.connected || false,
        user_id_ml: data?.user_id_ml,
        ml_nickname: data?.ml_nickname,
        expires_at: data?.expires_at,
      };
    } catch (error) {
      console.error('ML Auth Status Exception:', error);
      return { 
        isConnected: false, 
        error: 'Network error while checking auth status' 
      };
    }
  }

  static async startAuth(): Promise<{ auth_url: string; state: string }> {
    const { data, error } = await supabase.functions.invoke('ml-auth', {
      body: { action: 'start_auth' }
    });

    if (error) {
      throw new Error(error.message || 'Failed to start ML authentication');
    }

    return data;
  }

  static async handleCallback(code: string, state: string): Promise<void> {
    const { error } = await supabase.functions.invoke('ml-auth', {
      body: { action: 'handle_callback', code, state }
    });

    if (error) {
      throw new Error(error.message || 'Failed to process ML callback');
    }
  }

  static async refreshToken(): Promise<void> {
    const { error } = await supabase.functions.invoke('ml-auth', {
      body: { action: 'refresh_token' }
    });

    if (error) {
      throw new Error(error.message || 'Failed to refresh ML token');
    }
  }

  static async disconnect(): Promise<void> {
    const { error } = await supabase.functions.invoke('ml-auth', {
      body: { action: 'disconnect' }
    });

    if (error) {
      throw new Error(error.message || 'Failed to disconnect ML account');
    }
  }

  // ====== SINCRONIZAÇÃO ======

  static async getSyncStatus(): Promise<{ status_counts: MLSyncStatus; products: MLSyncProduct[] }> {
    const { data, error } = await supabase.functions.invoke('ml-sync-v2', {
      body: { action: 'get_sync_status' }
    });

    if (error) {
      throw new Error(error.message || 'Failed to get sync status');
    }

    return data;
  }

  static async syncProduct(productId: string): Promise<{ ml_item_id: string; ml_permalink: string }> {
    const { data, error } = await supabase.functions.invoke('ml-sync-v2', {
      body: { action: 'sync_product', product_id: productId }
    });

    if (error) {
      throw new Error(error.message || 'Failed to sync product');
    }

    return data;
  }

  static async syncBatch(productIds: string[]): Promise<{
    results: Array<{ product_id: string; ml_item_id?: string; ml_permalink?: string }>;
    errors: Array<{ product_id: string; error: string }>;
    total_processed: number;
    successful: number;
    failed: number;
  }> {
    const { data, error } = await supabase.functions.invoke('ml-sync-v2', {
      body: { action: 'sync_batch', product_ids: productIds }
    });

    if (error) {
      throw new Error(error.message || 'Failed to sync products batch');
    }

    return data;
  }

  static async importFromML(): Promise<{
    imported: number;
    errors: number;
    total_ml_items: number;
    results: Array<{
      ml_item_id: string;
      product_id?: string;
      action: 'created' | 'linked' | 'skipped';
      title?: string;
      reason?: string;
    }>;
    import_errors: Array<{ ml_item_id: string; error: string }>;
  }> {
    const { data, error } = await supabase.functions.invoke('ml-sync-v2', {
      body: { action: 'import_from_ml' }
    });

    if (error) {
      throw new Error(error.message || 'Failed to import products from ML');
    }

    return data;
  }

  static async linkProduct(productId: string, mlItemId: string): Promise<{
    ml_item_id: string;
    ml_permalink: string;
  }> {
    const { data, error } = await supabase.functions.invoke('ml-sync-v2', {
      body: { action: 'link_product', product_id: productId, ml_item_id: mlItemId }
    });

    if (error) {
      throw new Error(error.message || 'Failed to link product');
    }

    return data;
  }

  static async createAd(productId: string, adData: any): Promise<{
    ml_item_id: string;
    ml_permalink: string;
    title: string;
    price: number;
  }> {
    const { data, error } = await supabase.functions.invoke('ml-sync-v2', {
      body: { action: 'create_ad', product_id: productId, ad_data: adData }
    });

    if (error) {
      throw new Error(error.message || 'Failed to create ML ad');
    }

    return data;
  }

  // ====== CONFIGURAÇÕES AVANÇADAS ======

  static async getAdvancedSettings(): Promise<MLAdvancedSettings> {
    const { data, error } = await supabase.rpc('get_ml_advanced_settings');

    if (error) {
      throw new Error(error.message || 'Failed to get ML advanced settings');
    }

    return data;
  }

  static async updateAdvancedSettings(settings: Partial<MLAdvancedSettings>): Promise<MLAdvancedSettings> {
    const { data, error } = await supabase.rpc('update_ml_advanced_settings', {
      p_settings: settings
    });

    if (error) {
      throw new Error(error.message || 'Failed to update ML advanced settings');
    }

    return data;
  }

  // ====== MÉTRICAS E PERFORMANCE ======

  static async getPerformanceMetrics(days: number = 7): Promise<MLPerformanceMetrics> {
    const { data, error } = await supabase.rpc('get_ml_performance_metrics', {
      p_days: days
    });

    if (error) {
      throw new Error(error.message || 'Failed to get ML performance metrics');
    }

    return data;
  }

  static async getIntegrationHealth(): Promise<Array<{
    tenant_id: string;
    ml_nickname: string;
    user_id_ml: number;
    expires_at: string;
    connected_at: string;
    health_status: 'healthy' | 'good' | 'warning' | 'critical' | 'expired';
    hours_until_expiry: number;
    successful_renewals_24h: number;
    failed_renewals_24h: number;
  }>> {
    const { data, error } = await supabase.rpc('get_ml_integration_health');

    if (error) {
      throw new Error(error.message || 'Failed to get ML integration health');
    }

    return data;
  }

  // ====== OPERAÇÕES DE BACKUP E MANUTENÇÃO ======

  static async backupConfiguration(): Promise<any> {
    const { data, error } = await supabase.rpc('backup_ml_configuration');

    if (error) {
      throw new Error(error.message || 'Failed to backup ML configuration');
    }

    return data;
  }

  static async checkRateLimit(operationType: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_ml_rate_limit', {
      p_operation_type: operationType
    });

    if (error) {
      console.warn('Rate limit check failed:', error);
      return true; // Allow operation if check fails
    }

    return data;
  }

  // ====== UTILITY METHODS ======

  static formatAuthError(error: string): string {
    const errorMap: Record<string, string> = {
      'token_expired': 'Sua sessão do Mercado Livre expirou. Reconecte sua conta.',
      'invalid_token': 'Token do Mercado Livre inválido. Reconecte sua conta.',
      'network_error': 'Erro de conexão. Verifique sua internet e tente novamente.',
      'rate_limit': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
      'unauthorized': 'Não autorizado. Reconecte sua conta do Mercado Livre.',
    };

    return errorMap[error] || 'Erro desconhecido na integração com Mercado Livre';
  }

  static formatSyncStatus(status: string): { label: string; color: string } {
    const statusMap: Record<string, { label: string; color: string }> = {
      'not_synced': { label: 'Não Sincronizado', color: 'gray' },
      'syncing': { label: 'Sincronizando...', color: 'blue' },
      'synced': { label: 'Sincronizado', color: 'green' },
      'error': { label: 'Erro', color: 'red' },
      'pending': { label: 'Pendente', color: 'yellow' },
    };

    return statusMap[status] || { label: 'Desconhecido', color: 'gray' };
  }

  static isTokenExpiringSoon(expiresAt: string, hours: number = 24): boolean {
    if (!expiresAt) return false;
    
    const expiryTime = new Date(expiresAt).getTime();
    const warningTime = Date.now() + (hours * 60 * 60 * 1000);
    
    return expiryTime <= warningTime;
  }

  static calculateHealthScore(metrics: MLPerformanceMetrics): {
    score: number;
    level: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
  } {
    const successRate = metrics.success_rate || 0;
    const avgResponseTime = metrics.average_response_time || 0;
    
    let score = 0;
    const recommendations: string[] = [];

    // Success rate (40% of score)
    if (successRate >= 95) score += 40;
    else if (successRate >= 90) score += 35;
    else if (successRate >= 80) score += 25;
    else if (successRate >= 70) score += 15;
    else {
      score += 5;
      recommendations.push('Taxa de sucesso baixa - verifique erros recentes');
    }

    // Response time (30% of score)
    if (avgResponseTime <= 1000) score += 30;
    else if (avgResponseTime <= 2000) score += 25;
    else if (avgResponseTime <= 5000) score += 15;
    else if (avgResponseTime <= 10000) score += 10;
    else {
      score += 5;
      recommendations.push('Tempo de resposta alto - otimize operações');
    }

    // Operation volume (20% of score)
    if (metrics.total_operations >= 100) score += 20;
    else if (metrics.total_operations >= 50) score += 15;
    else if (metrics.total_operations >= 10) score += 10;
    else score += 5;

    // Error rate (10% of score)
    const errorRate = metrics.total_operations > 0 
      ? (metrics.failed_operations / metrics.total_operations) * 100 
      : 0;
    
    if (errorRate <= 5) score += 10;
    else if (errorRate <= 10) score += 8;
    else if (errorRate <= 20) score += 5;
    else {
      score += 2;
      recommendations.push('Taxa de erro alta - revise configurações');
    }

    let level: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 85) level = 'excellent';
    else if (score >= 70) level = 'good';
    else if (score >= 50) level = 'fair';
    else level = 'poor';

    if (recommendations.length === 0) {
      recommendations.push('Integração funcionando perfeitamente!');
    }

    return { score, level, recommendations };
  }
}