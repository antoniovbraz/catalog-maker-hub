// Hook centralizado para integração ML - implementa princípios SOLID e DRY
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { MLService, MLBatchSyncResult } from '@/services/ml-service';
import { useAuth } from '@/contexts/AuthContext';
export { useMLAuthDisconnect } from './useMLAuthDisconnect';

// Chaves de query centralizadas
export const ML_QUERY_KEYS = {
  base: (tenantId?: string) => ['ml', tenantId] as const,
  auth: (tenantId?: string) => ['ml', tenantId, 'auth'] as const,
  syncStatus: (tenantId?: string) => ['ml', tenantId, 'sync', 'status'] as const,
  syncProducts: (tenantId?: string) => ['ml', tenantId, 'sync', 'products'] as const,
  products: (tenantId?: string) => ['ml', tenantId, 'products'] as const,
  performanceMetrics: (tenantId: string | undefined, days: number) => ['ml', tenantId, 'performance', days] as const,
  advancedSettings: (tenantId?: string) => ['ml', tenantId, 'settings', 'advanced'] as const,
  integrationHealth: (tenantId?: string) => ['ml', tenantId, 'health'] as const,
} as const;

// ====== HOOK PRINCIPAL ======
export function useMLIntegration() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const queryClient = useQueryClient();

  // Autenticação
  const authQuery = useQuery({
    queryKey: ML_QUERY_KEYS.auth(tenantId),
    queryFn: MLService.getAuthStatus,
    enabled: !!tenantId,
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
    queryKey: ML_QUERY_KEYS.syncStatus(tenantId),
    queryFn: MLService.getSyncStatus,
    enabled: (!!tenantId && authQuery.data?.isConnected) || false,
    staleTime: 30 * 1000, // 30 segundos
  });

  // Métricas de performance
  const performanceQuery = useQuery({
    queryKey: ML_QUERY_KEYS.performanceMetrics(tenantId, 7),
    queryFn: () => MLService.getPerformanceMetrics(7),
    enabled: (!!tenantId && authQuery.data?.isConnected) || false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Configurações avançadas
  const advancedSettingsQuery = useQuery({
    queryKey: ML_QUERY_KEYS.advancedSettings(tenantId),
    queryFn: MLService.getAdvancedSettings,
    enabled: (!!tenantId && authQuery.data?.isConnected) || false,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  // Invalidar todas as queries ML
  const invalidateAllQueries = () => {
    queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.base(tenantId) });
  };

  // Estado computado
  const isConnected = authQuery.data?.isConnected || false;
  const isLoading = authQuery.isLoading;
  const hasError = authQuery.isError || syncStatusQuery.isError;
  const authData = authQuery.data;
  const syncActions = useMLSyncActions();
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
    sync: {
      ...(syncData ?? {}),
      ...syncActions,
    },
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
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
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
      queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.auth(tenantId) });
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
      queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.auth(tenantId) });
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
      queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.base(tenantId) });
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

function useMLSyncActions() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const queryClient = useQueryClient();

  const syncProduct = useMutation({
    mutationFn: async (productId: string) => {
      try {
        await MLService.syncProduct(productId);
      } catch (error) {
        const message = (error as Error).message || '';
        if (message.includes('Missing required fields')) {
          try {
            await MLService.resyncProduct(productId);
            await MLService.syncProduct(productId);
          } catch (resyncError: unknown) {
            const status = (resyncError as { status?: number })?.status;
            const errorMessage = (resyncError as Error)?.message || '';

            if (status === 404 || errorMessage.includes("404")) {
              toast({
                title: "Erro na Re-sincronização",
                description: "Produto não está vinculado a um item do Mercado Livre",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Erro na Re-sincronização",
                description: "Falha ao importar dados do ML",
                variant: "destructive",
              });
            }

            throw resyncError;
          }
        } else {
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.syncStatus(tenantId) });
      toast({
        title: "Produto Sincronizado",
        description: `Produto sincronizado com sucesso no ML.`,
      });
    },
    onError: (error: Error) => {
      const handledMessages = [
        "Produto não está vinculado a um item do Mercado Livre",
        "Falha ao importar dados do ML",
      ];

      if (handledMessages.includes(error.message)) return;

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
      queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.syncStatus(tenantId) });

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
      queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.syncStatus(tenantId) });
      queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.products(tenantId) });
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] }); // Invalidar produtos também
      
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
      queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.syncStatus(tenantId) });
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
      mutationFn: ({ adData }: { adData: Record<string, unknown> }) =>
        MLService.createAd(adData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.syncStatus(tenantId) });
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
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const queryClient = useQueryClient();

  const updateAdvancedSettings = useMutation({
    mutationFn: MLService.updateAdvancedSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.advancedSettings(tenantId) });
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