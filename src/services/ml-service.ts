import { supabase } from '@/integrations/supabase/client';
import { callMLFunction } from '@/utils/ml/ml-api';

// ==================== TIPOS ====================

export interface MLSyncStatus {
  total_products: number;
  synced_products: number;
  pending_products: number;
  error_products: number;
  last_sync: string | null;
  // Operações recentes (últimas 24h)
  successful_24h?: number;
  failed_24h?: number;
  total_24h?: number;
  health_status?: string;
  // Aliases para compatibilidade
  total?: number;
  synced?: number;
  pending?: number;
  error?: number;
  status_counts?: MLSyncStatus;
  products?: MLSyncProduct[];
}

export interface MLSyncProduct {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  cost_unit?: number;
  image_url?: string;
  ml_item_id?: string | null;
  ml_permalink?: string | null;
  sync_status: 'pending' | 'syncing' | 'synced' | 'error' | 'not_synced';
  last_sync?: string | null;
  last_sync_at?: string | null;
  error_message?: string | null;
}

export interface MLBatchSyncResult {
  successful: number;
  failed: number;
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

// ==================== SERVIÇO PRINCIPAL ====================

export class MLService {
  // ====== AUTENTICAÇÃO ======

  static async getAuthStatus(): Promise<MLAuthStatus> {
    try {
      const data = await callMLFunction('ml-auth', 'get_status', {}, {});
      return {
        isConnected: data?.connected || false,
        user_id_ml: data?.user_id_ml,
        ml_nickname: data?.ml_nickname,
        expires_at: data?.expires_at,
      };
    } catch (error) {
      console.error('ML Auth Status Exception:', error);
      const message = error instanceof Error ? error.message : 'Failed to check auth status';
      if (message.toLowerCase().includes('network')) {
        return {
          isConnected: false,
          error: 'Network error while checking auth status'
        };
      }
      return {
        isConnected: false,
        error: message || 'Failed to check auth status'
      };
    }
  }

  static async startAuth(): Promise<{ auth_url: string; state: string }> {
    try {
      return await callMLFunction('ml-auth', 'start_auth', {}, {});
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message || 'Failed to start ML authentication' : 'Failed to start ML authentication'
      );
    }
  }

  static async handleCallback(code: string, state: string): Promise<void> {
    try {
      await callMLFunction('ml-auth', 'handle_callback', { code, state }, {});
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message || 'Failed to process ML callback' : 'Failed to process ML callback'
      );
    }
  }

  static async refreshToken(): Promise<void> {
    try {
      await callMLFunction('ml-auth', 'refresh_token', {}, {});
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message || 'Failed to refresh ML token' : 'Failed to refresh ML token'
      );
    }
  }

  static async disconnect(): Promise<void> {
    try {
      await callMLFunction('ml-auth', 'disconnect', {}, {});
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message || 'Failed to disconnect ML account' : 'Failed to disconnect ML account'
      );
    }
  }

  // ====== SINCRONIZAÇÃO ======

  static async getSyncStatus(): Promise<MLSyncStatus> {
    const data = await callMLFunction('ml-sync-v2', 'get_status', {}, {});

    return {
      total_products: data?.total_products || 0,
      synced_products: data?.synced_products || 0,
      pending_products: data?.pending_products || 0,
      error_products: data?.error_products || 0,
      last_sync: data?.last_sync || null,
      successful_24h: data?.successful_24h || 0,
      failed_24h: data?.failed_24h || 0,
      total_24h: data?.total_24h || 0,
      health_status: data?.health_status || 'unknown',
      // Aliases para compatibilidade
      total: data?.total_products || 0,
      synced: data?.synced_products || 0,
      pending: data?.pending_products || 0,
      error: data?.error_products || 0,
      status_counts: data,
      products: []
    };
  }

  static async getMLProducts(): Promise<MLSyncProduct[]> {
    const data = await callMLFunction('ml-sync-v2', 'get_products', {}, {});

    return data?.products || [];
  }

  static async syncProduct(productId: string): Promise<void> {
    await callMLFunction('ml-sync-v2', 'sync_product', { product_id: productId }, {});
  }

  static async syncBatch(productIds: string[]): Promise<MLBatchSyncResult> {
    const data = await callMLFunction('ml-sync-v2', 'sync_batch', { product_ids: productIds }, {});

    return {
      successful: data?.successful ?? 0,
      failed: data?.failed ?? 0
    };
  }

  static async resyncProduct(productId: string): Promise<void> {
    await callMLFunction('ml-sync-v2', 'resync_product', { productId }, {});
  }

  static async resyncBatch(productIds: string[]): Promise<MLBatchSyncResult> {
    let successful = 0;
    let failed = 0;

    for (const id of productIds) {
      try {
        await MLService.resyncProduct(id);
        successful++;
      } catch (err) {
        console.error('Failed to re-sync product:', id, err);
        failed++;
      }
    }

    return { successful, failed };
  }

  static async importFromML(): Promise<{ imported: number; items: unknown[] }> {
    const data = await callMLFunction('ml-sync-v2', 'import_from_ml', {}, {});

    return {
      imported: data?.imported || 0,
      items: data?.items || []
    };
  }

  static async linkProduct(productId: string, mlItemId: string): Promise<void> {
    await callMLFunction('ml-sync-v2', 'link_product', { product_id: productId, ml_item_id: mlItemId }, {});
  }

  static async createAd(adData: Record<string, unknown>): Promise<{ title: string; success: boolean }> {
    await callMLFunction('ml-sync-v2', 'create_ad', { ad_data: adData }, {});

    return { title: adData.title || 'Anúncio criado', success: true };
  }

  // ====== CONFIGURAÇÕES AVANÇADAS ======

  static async getAdvancedSettings(): Promise<MLAdvancedSettings> {
    const { data, error } = await supabase.rpc('get_ml_advanced_settings');

    if (error) {
      throw new Error(error.message || 'Failed to get advanced settings');
    }

    return data;
  }

  static async updateAdvancedSettings(settings: Partial<MLAdvancedSettings>): Promise<MLAdvancedSettings> {
    const { data, error } = await supabase.rpc('update_ml_advanced_settings', {
      p_settings: settings
    });

    if (error) {
      throw new Error(error.message || 'Failed to update advanced settings');
    }

    return data;
  }

  // ====== MÉTRICAS E PERFORMANCE ======

  static async getPerformanceMetrics(days: number = 7): Promise<MLPerformanceMetrics> {
    const { data, error } = await supabase.rpc('get_ml_performance_metrics', {
      p_days: days
    });

    if (error) {
      throw new Error(error.message || 'Failed to get performance metrics');
    }

    return data;
  }

  static async getIntegrationHealth(): Promise<unknown> {
    const { data, error } = await supabase.rpc('get_ml_integration_health');

    if (error) {
      throw new Error(error.message || 'Failed to get integration health');
    }

    return data;
  }

  // ====== MANUTENÇÃO ======

  static async backupConfiguration(): Promise<unknown> {
    const { data, error } = await supabase.rpc('backup_ml_configuration');

    if (error) {
      throw new Error(error.message || 'Failed to backup configuration');
    }

    return data;
  }

  static async checkRateLimit(operationType: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_ml_rate_limit', {
      p_operation_type: operationType
    });

    if (error) {
      console.error('Rate limit check error:', error);
      return false;
    }

    return data || false;
  }

  // ====== UTILIDADES ======

  static formatAuthError(error: string): string {
    const errorMap: Record<string, string> = {
      'invalid_grant': 'Código de autorização inválido ou expirado',
      'invalid_client': 'Credenciais do aplicativo inválidas',
      'access_denied': 'Acesso negado pelo usuário',
      'server_error': 'Erro interno do Mercado Livre',
      'temporarily_unavailable': 'Serviço temporariamente indisponível',
    };

    return errorMap[error] || 'Erro desconhecido na autenticação ML';
  }

  static formatSyncStatus(status: string): { label: string; color: string } {
    const statusMap: Record<string, { label: string; color: string }> = {
      'pending': { label: 'Pendente', color: 'yellow' },
      'syncing': { label: 'Sincronizando', color: 'blue' },
      'synced': { label: 'Sincronizado', color: 'green' },
      'error': { label: 'Erro', color: 'red' },
      'draft': { label: 'Rascunho', color: 'gray' },
      'paused': { label: 'Pausado', color: 'orange' },
    };

    return statusMap[status] || { label: 'Desconhecido', color: 'gray' };
  }

  static isTokenExpiringSoon(expiresAt: string, hours: number = 6): boolean {
    const expirationDate = new Date(expiresAt);
    const warningDate = new Date(Date.now() + (hours * 60 * 60 * 1000));
    return expirationDate <= warningDate;
  }

  static calculateHealthScore(metrics: MLPerformanceMetrics): {
    score: number;
    level: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
  } {
    let score = 100;
    const recommendations: string[] = [];

    // Penalizar baixa taxa de sucesso
    if (metrics.success_rate < 95) {
      score -= (95 - metrics.success_rate) * 2;
      recommendations.push('Verificar logs de erro para identificar problemas');
    }

    // Penalizar tempo de resposta alto
    if (metrics.average_response_time > 5000) {
      score -= Math.min(20, (metrics.average_response_time - 5000) / 100);
      recommendations.push('Otimizar performance das requisições');
    }

    // Penalizar muitas operações falhadas
    if (metrics.failed_operations > metrics.total_operations * 0.1) {
      score -= 15;
      recommendations.push('Investigar causa das falhas nas operações');
    }

    // Determinar nível
    let level: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 90) level = 'excellent';
    else if (score >= 75) level = 'good';
    else if (score >= 60) level = 'fair';
    else level = 'poor';

    return {
      score: Math.max(0, Math.round(score)),
      level,
      recommendations
    };
  }
}