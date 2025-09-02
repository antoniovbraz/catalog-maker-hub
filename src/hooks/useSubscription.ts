import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscription';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { Subscription } from '@/types/subscription';

export function useSubscriptionPlans() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  return useQuery({
    queryKey: ['subscription-plans', tenantId],
    queryFn: () => subscriptionService.getAllPlans(),
    enabled: !!tenantId,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

export function useCurrentSubscription() {
  const { user, profile } = useAuth();
  const tenantId = profile?.tenant_id;

  return useQuery({
    queryKey: ['current-subscription', tenantId, user?.id],
    queryFn: () => user ? subscriptionService.getCurrentSubscription(user.id) : null,
    enabled: !!user && !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useUsageTracking(resourceType?: string) {
  const { user, profile } = useAuth();
  const tenantId = profile?.tenant_id;

  return useQuery({
    queryKey: ['usage-tracking', tenantId, user?.id, resourceType],
    queryFn: () => user ? subscriptionService.getUserUsage(user.id, resourceType) : [],
    enabled: !!user && !!tenantId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

export function useUsageLimit() {
  const { user, profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const queryClient = useQueryClient();
  
  const checkLimit = useMutation({
    mutationFn: ({ resourceType, increment = 1 }: { resourceType: string; increment?: number }) => {
      if (!user) throw new Error('Usuário não autenticado');
      return subscriptionService.checkUsageLimit(user.id, resourceType, increment);
    },
  });
  
  const incrementUsage = useMutation({
    mutationFn: ({ resourceType, increment = 1 }: { resourceType: string; increment?: number }) => {
      if (!user) throw new Error('Usuário não autenticado');
      return subscriptionService.incrementUsage(user.id, resourceType, increment);
    },
    onSuccess: () => {
      // Invalidar queries relacionadas ao uso
      queryClient.invalidateQueries({ queryKey: ['usage-tracking', tenantId] });
    },
  });
  
  return { checkLimit, incrementUsage };
}

export function useSubscriptionMutations() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  const createSubscription = useMutation({
    mutationFn: subscriptionService.createSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription', tenantId] });
      toast({
        title: "Assinatura criada",
        description: "Sua assinatura foi ativada com sucesso!"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na assinatura",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
    const updateSubscription = useMutation({
      mutationFn: ({ userId, updates }: { userId: string; updates: Partial<Subscription> }) =>
        subscriptionService.updateSubscription(userId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription', tenantId] });
      toast({
        title: "Assinatura atualizada",
        description: "Suas informações foram atualizadas."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const cancelSubscription = useMutation({
    mutationFn: subscriptionService.cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription', tenantId] });
      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura foi cancelada. Você ainda pode usar até o final do período."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cancelar",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  return {
    createSubscription,
    updateSubscription,
    cancelSubscription
  };
}