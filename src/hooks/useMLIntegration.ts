// Hook centralizado para integração ML - implementa princípios SOLID e DRY
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { MLService, MLAuthStatus, MLSyncStatus, MLSyncProduct, MLPerformanceMetrics, MLAdvancedSettings, MLBatchSyncResult } from '@/services/ml-service';

// Chaves de query centralizadas
export const ML_QUERY_KEYS = {
  auth: ['ml', 'auth'] as const,
  syncStatus: ['ml', 'sync', 'status'] as const,
  syncProducts: ['ml', 'sync', 'products'] as const,
  products: ['ml', 'products'] as const,
  performanceMetrics: (days: number) => ['ml', 'performance', days] as const,
  advancedSettings: ['ml', 'settings', 'advanced'] as const,
  integrationHealth: ['ml', 'health'] as const,
} as const;

// ====== HOOK PRINCIPAL ======
export function useMLIntegration() {
  const queryClient = useQueryClient();

  // Autenticação
  const authQuery = useQuery({
    queryKey: ML_QUERY_KEYS.auth,
    queryFn: MLService.getAuthStatus,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: (failureCount, error) => {
      // Não retentar para erros específicos
      if (error?.message?.includes('token_expired') || 
          error?.message?.includes('unauthorized')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Status de sincronização
  const syncStatusQuery = useQuery({
    queryKey: ML_QUERY_KEYS.syncStatus,
    queryFn: MLService.getSyncStatus,
    enabled: authQuery.data?.isConnected || false,
    staleTime: 30 * 1000, // 30 segundos
  });

  // Métricas de performance
  const performanceQuery = useQuery({
    queryKey: ML_QUERY_KEYS.performanceMetrics(7),
    queryFn: () => MLService.getPerformanceMetrics(7),
    enabled: authQuery.data?.isConnected || false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Configurações avançadas
  const advancedSettingsQuery = useQuery({
    queryKey: ML_QUERY_KEYS.advancedSettings,
    queryFn: MLService.getAdvancedSettings,
    enabled: authQuery.data?.isConnected || false,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  // Invalidar todas as queries ML
  const invalidateAllQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['ml'] });
  };

  // Estado computado
  const isConnected = authQuery.data?.isConnected || false;
  const isLoading = authQuery.isLoading;
  const hasError = authQuery.isError || syncStatusQuery.isError;
  const authData = authQuery.data;
  const syncData = syncStatusQuery.data;
  const performanceData = performanceQuery.data;
  const settingsData = advancedSettingsQuery.data;

  return {
    // Estados
    isConnected,
    isLoading,
    hasError,
    
    // Dados
    auth: authData,
    sync: syncData,
    performance: performanceData,
    settings: settingsData,
    
    // Queries individuais (para loading states específicos)
    authQuery,
    syncStatusQuery,
    performanceQuery,
    advancedSettingsQuery,
    
    // Utilitários
    invalidateAllQueries,
  };
}

// ====== HOOKS ESPECÍFICOS PARA AÇÕES ======

export function useMLAuth() {
  const queryClient = useQueryClient();

  const startAuth = useMutation({
    mutationFn: MLService.startAuth,
    onSuccess: (data) => {
      // Redirecionar para URL de autorização do ML
      window.location.href = data.auth_url;
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na Autenticação",
        description: MLService.formatAuthError(error.message),
        variant: "destructive",
      });
    },
  });

  const handleCallback = useMutation({
    mutationFn: ({ code, state }: { code: string; state: string }) => 
      MLService.handleCallback(code, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.auth });
      toast({
        title: "Conectado com Sucesso",
        description: "Sua conta do Mercado Livre foi conectada.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no Callback",
        description: MLService.formatAuthError(error.message),
        variant: "destructive",
      });
    },
  });

  const refreshToken = useMutation({
    mutationFn: MLService.refreshToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.auth });
      toast({
        title: "Token Renovado",
        description: "Sua sessão foi renovada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na Renovação",
        description: MLService.formatAuthError(error.message),
        variant: "destructive",
      });
    },
  });

  const disconnect = useMutation({
    mutationFn: MLService.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml'] });
      toast({
        title: "Desconectado",
        description: "Sua conta do Mercado Livre foi desconectada.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na Desconexão",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    startAuth,
    handleCallback,
    refreshToken,
    disconnect,
  };
}

export function useMLSync() {
  const queryClient = useQueryClient();

  const syncProduct = useMutation({
    mutationFn: MLService.syncProduct,
    onSuccess: (data, productId) => {
      queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.syncStatus });
      toast({
        title: "Produto Sincronizado",
        description: `Produto sincronizado com sucesso no ML.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na Sincronização",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncBatch = useMutation<MLBatchSyncResult, Error, string[]>({
    mutationFn: MLService.syncBatch,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.syncStatus });

      if (data?.successful && data.successful > 0) {
        toast({
          title: "Sincronização em Lote",
          description: `${data.successful} produtos sincronizados com sucesso.`,
        });
      }

      if (data?.failed && data.failed > 0) {
        toast({
          title: "Alguns Erros na Sincronização",
          description: `${data.failed} produtos falharam na sincronização.`,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na Sincronização em Lote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const importFromML = useMutation({
    mutationFn: MLService.importFromML,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.syncStatus });
      queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.products });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Invalidar produtos também
      
      toast({
        title: "Importação Concluída",
        description: `${data?.imported || 0} produtos importados do Mercado Livre.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na Importação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const linkProduct = useMutation({
      mutationFn: ({ productId, mlItemId }: { productId: string; mlItemId: string }) =>
        MLService.linkProduct(productId, mlItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.syncStatus });
      toast({
        title: "Produto Vinculado",
        description: "Produto vinculado com sucesso ao item do ML.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no Vínculo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createAd = useMutation({
    mutationFn: ({ adData }: { adData: any }) =>
      MLService.createAd(adData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.syncStatus });
      toast({
        title: "Anúncio Criado",
        description: `Anúncio "${data?.title || 'criado'}" criado com sucesso no ML.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na Criação do Anúncio",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    syncProduct,
    syncBatch,
    importFromML,
    linkProduct,
    createAd,
  };
}

export function useMLSettings() {
  const queryClient = useQueryClient();

  const updateAdvancedSettings = useMutation({
    mutationFn: MLService.updateAdvancedSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.advancedSettings });
      toast({
        title: "Configurações Atualizadas",
        description: "Configurações avançadas do ML foram atualizadas.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro nas Configurações",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const backupConfiguration = useMutation({
    mutationFn: MLService.backupConfiguration,
    onSuccess: () => {
      toast({
        title: "Backup Criado",
        description: "Backup das configurações ML criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no Backup",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    updateAdvancedSettings,
    backupConfiguration,
  };
}

// ====== HOOKS DERIVADOS ======

export function useMLConnectionStatus() {
  const { auth, isLoading } = useMLIntegration();
  
  const isExpiringSoon = auth?.expires_at 
    ? MLService.isTokenExpiringSoon(auth.expires_at, 24)
    : false;

  const connectionHealth = auth?.expires_at && auth.isConnected
    ? MLService.isTokenExpiringSoon(auth.expires_at, 2) 
      ? 'critical'
      : isExpiringSoon 
        ? 'warning' 
        : 'healthy'
    : 'disconnected';

  return {
    isConnected: auth?.isConnected || false,
    isExpiringSoon,
    connectionHealth,
    expiresAt: auth?.expires_at,
    userInfo: {
      id: auth?.user_id_ml,
      nickname: auth?.ml_nickname,
    },
    isLoading,
  };
}

export function useMLHealthScore() {
  const { performance } = useMLIntegration();
  
  const healthScore = performance 
    ? MLService.calculateHealthScore(performance)
    : null;

  return {
    score: healthScore?.score,
    level: healthScore?.level,
    recommendations: healthScore?.recommendations || [],
    hasData: !!performance,
  };
}