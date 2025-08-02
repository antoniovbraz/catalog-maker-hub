import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { pricingService } from "@/services/pricing";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { PRICING_QUERY_KEY } from "./usePricing";

export function useAutomaticPricingUpdate() {
  const queryClient = useQueryClient();
  const isUpdatingRef = useRef(false);

  const handleRulesUpdate = async (tableName: string, eventType: string) => {
    // Evitar múltiplas execuções simultâneas
    if (isUpdatingRef.current) {
      console.log('Recálculo já em andamento, ignorando evento...');
      return;
    }

    console.log(`Detectada mudança na tabela ${tableName} (${eventType})`);
    
    isUpdatingRef.current = true;
    
    try {
      toast({
        title: "Atualizando precificações",
        description: "Recalculando todas as precificações com as novas regras...",
      });

      const result = await pricingService.recalculateAllPricing();
      
      // Invalidar cache das precificações para recarregar os dados
      queryClient.invalidateQueries({ queryKey: [PRICING_QUERY_KEY] });
      
      toast({
        title: "Precificações atualizadas",
        description: `${result.updated} precificações foram recalculadas${result.errors > 0 ? ` (${result.errors} erros)` : ''}`,
      });
      
    } catch (error) {
      console.error('Erro no recálculo automático:', error);
      toast({
        title: "Erro na atualização",
        description: "Falha ao recalcular precificações automaticamente",
        variant: "destructive",
      });
    } finally {
      isUpdatingRef.current = false;
    }
  };

  useEffect(() => {
    console.log('Configurando listeners de atualização automática...');
    
    // Canal para mudanças nas comissões
    const commissionsChannel = supabase
      .channel('commissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'commissions'
        },
        (payload) => {
          console.log('Mudança detectada em commissions:', payload);
          handleRulesUpdate('commissions', payload.eventType);
        }
      )
      .subscribe();

    // Canal para mudanças nas taxas fixas
    const fixedFeesChannel = supabase
      .channel('fixed-fees-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketplace_fixed_fee_rules'
        },
        (payload) => {
          console.log('Mudança detectada em marketplace_fixed_fee_rules:', payload);
          handleRulesUpdate('marketplace_fixed_fee_rules', payload.eventType);
        }
      )
      .subscribe();

    // Canal para mudanças nas regras de frete
    const shippingChannel = supabase
      .channel('shipping-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipping_rules'
        },
        (payload) => {
          console.log('Mudança detectada em shipping_rules:', payload);
          handleRulesUpdate('shipping_rules', payload.eventType);
        }
      )
      .subscribe();

    // Cleanup dos canais
    return () => {
      console.log('Removendo listeners de atualização automática...');
      supabase.removeChannel(commissionsChannel);
      supabase.removeChannel(fixedFeesChannel);
      supabase.removeChannel(shippingChannel);
    };
  }, []); // Removida a dependência do queryClient para evitar loops

  return {
    triggerManualUpdate: () => handleRulesUpdate('manual', 'manual_trigger')
  };
}