import { supabase } from '@/integrations/supabase/client';
import { callMLFunction } from '@/utils/ml/ml-api';
import { logger } from '@/lib/logger';
import {
  mlAdvancedSettingsSchema,
  type MLAdvancedSettings,
} from '@/types/ml/advanced-settings';
import { mlAuthStatusResponseSchema } from '@/types/ml/auth';
import {
  mlSyncStatusResponseSchema,
  mlProductsResponseSchema,
  mlBatchSyncResultSchema,
  mlImportResultSchema,
  type MLSyncProduct,
  type MLBatchSyncResult,
} from '@/types/ml/sync';
import { ZodError } from 'zod';

// ==================== TIPOS ====================

export type { MLSyncProduct, MLBatchSyncResult };

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

// ==================== SERVIÇO PRINCIPAL ====================

export class MLService {
  // ====== AUTENTICAÇÃO ======

  static async getAuthStatus(): Promise<MLAuthStatus> {
    try {
      const raw = await callMLFunction('ml-auth', 'get_status', {}, {});
      const data = mlAuthStatusResponseSchema.parse(raw);
      return {
        isConnected: data.connected,
        user_id_ml: data.user_id_ml ?? undefined,
        ml_nickname: data.ml_nickname ?? undefined,
        expires_at: data.expires_at ?? undefined,
      };
    } catch (error) {
      logger.error('MLService.getAuthStatus', 'Auth status check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      const message = error instanceof ZodError
        ? 'Invalid auth status response'
        : error instanceof Error
          ? error.message
          : 'Failed to check auth status';
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
      const data = await callMLFunction('ml-auth', 'start_auth', {}, {}) as { auth_url: string; state: string };
      return data;
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
    try {
      const raw = await callMLFunction('ml-sync-v2', 'get_status', {}, {});
      const data = mlSyncStatusResponseSchema.parse(raw);

      const baseStatus = {
        total_products: data.total_products,
        synced_products: data.synced_products,
        pending_products: data.pending_products,
        error_products: data.error_products,
        last_sync: data.last_sync,
        successful_24h: data.successful_24h,
        failed_24h: data.failed_24h,
        total_24h: data.total_24h,
        health_status: data.health_status,
      };

      return {
        ...baseStatus,
        total: baseStatus.total_products,
        synced: baseStatus.synced_products,
        pending: baseStatus.pending_products,
        error: baseStatus.error_products,
        status_counts: baseStatus,
        products: data.products ?? [],
      };
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error('Invalid sync status response');
      }
      throw error;
    }
  }

  static async getMLProducts(): Promise<MLSyncProduct[]> {
    try {
      const raw = await callMLFunction('ml-sync-v2', 'get_products', {}, {});
      const data = mlProductsResponseSchema.parse(raw);
      return data.products;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error('Invalid products response');
      }
      throw error;
    }
  }

  static async syncProduct(productId: string): Promise<void> {
    await callMLFunction('ml-sync-v2', 'sync_product', { product_id: productId }, {});
  }

  static async syncBatch(productIds: string[]): Promise<MLBatchSyncResult> {
    try {
      const raw = await callMLFunction('ml-sync-v2', 'sync_batch', { product_ids: productIds }, {});
      return mlBatchSyncResultSchema.parse(raw);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error('Invalid batch sync response');
      }
      throw error;
    }
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
          logger.error('MLService.resyncBatch', 'Failed to resync product', {
            productId: id,
            error: err instanceof Error ? err.message : 'Unknown error'
          });
          failed++;
        }
      }

    return { successful, failed };
  }

  static async importFromML(): Promise<{ created: number; updated: number }> {
    try {
      const raw = await callMLFunction('ml-sync-v2', 'import_from_ml', {}, {});
      return mlImportResultSchema.parse(raw);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error('Invalid import response');
      }
      throw error;
    }
  }

  static async linkProduct(productId: string, mlItemId: string): Promise<void> {
    await callMLFunction('ml-sync-v2', 'link_product', { product_id: productId, ml_item_id: mlItemId }, {});
  }

  static async createAd(adData: Record<string, unknown>): Promise<{ title: string; success: boolean }> {
    await callMLFunction('ml-sync-v2', 'create_ad', { ad_data: adData }, {});

    return { title: (adData.title as string) || 'Anúncio criado', success: true };
  }

  // ====== CONFIGURAÇÕES AVANÇADAS ======

  static async getAdvancedSettings(): Promise<MLAdvancedSettings> {
    const { data, error } = await supabase.rpc('get_ml_advanced_settings');

    if (error) {
      throw new Error(error.message || 'Failed to get advanced settings');
    }

    return mlAdvancedSettingsSchema.parse(data);
  }

  static async updateAdvancedSettings(settings: Partial<MLAdvancedSettings>): Promise<MLAdvancedSettings> {
    const { data, error } = await supabase.rpc('update_ml_advanced_settings', {
      p_settings: settings
    });

    if (error) {
      throw new Error(error.message || 'Failed to update advanced settings');
    }

    return data as MLAdvancedSettings;
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
      logger.error('MLService.checkRateLimit', 'Rate limit check failed', {
        operationType,
        error: error.message
      });
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