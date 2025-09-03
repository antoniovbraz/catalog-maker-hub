import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para limpeza automática de dados temporários do ML
 * Remove dados PKCE expirados e otimiza performance
 */
export function useMLCleanup() {
  useEffect(() => {
    let isMounted = true;
    
    const cleanup = async () => {
      try {
        if (!isMounted) return;
        
        // Chamar função de limpeza no Supabase
        const { error } = await supabase.rpc('cleanup_expired_pkce');
        
        if (error && !error.message.includes('permission denied')) {
          console.warn('ML Cleanup warning:', error.message);
        } else if (!error) {
          console.log('ML cleanup executed successfully');
        }
      } catch (err) {
        // Silencioso - limpeza não é crítica
        console.debug('ML cleanup skipped:', err);
      }
    };

    // Executar limpeza imediatamente
    cleanup();

    // Executar limpeza a cada 30 minutos
    const interval = setInterval(cleanup, 30 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);
}

/**
 * Hook para monitoramento de status da integração ML
 * Fornece métricas e informações de debugging
 */
export function useMLStatus() {
  return {
    // Função para verificar logs recentes
    checkRecentLogs: async () => {
      try {
        const { data } = await supabase
          .from('ml_sync_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        
        return data || [];
      } catch (error) {
        console.error('Error fetching ML logs:', error);
        return [];
      }
    },
    
    // Função para verificar status da conexão
    checkConnectionHealth: async () => {
      try {
        const { data } = await supabase
          .from('ml_auth_tokens_decrypted')
          .select('expires_at, user_id_ml, created_at')
          .single();
        
        if (!data) return { status: 'disconnected' };
        
        const isExpired = new Date(data.expires_at) <= new Date();
        const daysConnected = Math.floor(
          (Date.now() - new Date(data.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        return {
          status: isExpired ? 'expired' : 'connected',
          daysConnected,
          userIdML: data.user_id_ml,
          expiresAt: data.expires_at
        };
      } catch (error: unknown) {
        return { status: 'error', error: (error as Error).message };
      }
    }
  };
}