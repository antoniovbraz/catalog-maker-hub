import { logger } from '@/utils/logger';

// Métricas específicas do negócio
export const BusinessMetrics = {
  // Sincronização ML
  mlSyncSuccess: (productId: string, duration: number) => {
    logger.info('ML sync success', {
      metric: {
        name: 'ml_sync_success',
        value: duration,
        unit: 'ms',
        tags: { productId, status: 'success' },
        timestamp: new Date().toISOString()
      },
      type: 'business_metric'
    });
  },

  mlSyncError: (productId: string, errorType: string) => {
    logger.info('ML sync error', {
      metric: {
        name: 'ml_sync_error',
        value: 1,
        unit: 'count',
        tags: { productId, errorType },
        timestamp: new Date().toISOString()
      },
      type: 'business_metric'
    });
  },

  // Cálculo de preços
  pricingCalculation: (duration: number, marketplace: string) => {
    logger.info('Pricing calculation completed', {
      metric: {
        name: 'pricing_calculation',
        value: duration,
        unit: 'ms',
        tags: { marketplace },
        timestamp: new Date().toISOString()
      },
      type: 'business_metric'
    });
  },

  // Atividade do usuário
  userAction: (action: string, userId: string, tenantId: string) => {
    logger.info('User action tracked', {
      metric: {
        name: 'user_action',
        value: 1,
        unit: 'count',
        tags: { action, userId, tenantId },
        timestamp: new Date().toISOString()
      },
      type: 'business_metric'
    });
  },

  // Performance de queries
  queryPerformance: (queryType: string, duration: number, success: boolean) => {
    logger.info('Query performance measured', {
      metric: {
        name: 'query_performance',
        value: duration,
        unit: 'ms',
        tags: { queryType, success: success.toString() },
        timestamp: new Date().toISOString()
      },
      type: 'business_metric'
    });
  }
};