import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base";
import { SavedPricingType, PricingCalculationParams, MargemRealParams } from "@/types/pricing";
import { logger } from "@/utils/logger";

export class PricingService extends BaseService<SavedPricingType> {
  constructor() {
    super('saved_pricing');
  }

  async getAllWithDetails(): Promise<(SavedPricingType & { 
    products: { id: string; name: string; sku: string };
    marketplaces: { id: string; name: string };
  })[]> {
    const { data, error } = await supabase
      .from('saved_pricing')
      .select(`
        *,
        products:product_id (
          id,
          name,
          sku
        ),
        marketplaces:marketplace_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) this.handleError(error, 'Buscar precificações com detalhes');
    return data || [];
  }

  async getByProductAndMarketplace(productId: string, marketplaceId: string): Promise<SavedPricingType[]> {
    const { data, error } = await supabase
      .from('saved_pricing')
      .select('*')
      .eq('product_id', productId)
      .eq('marketplace_id', marketplaceId)
      .order('created_at', { ascending: false });
    
    if (error) this.handleError(error, 'Buscar precificação por produto e marketplace');
    return data || [];
  }

  async calcularPreco(productId: string, marketplaceId: string, taxaCartao: number, provisaoDesconto: number, margemDesejada: number): Promise<any> {
    const { data, error } = await supabase.rpc('calcular_preco', {
      p_product_id: productId,
      p_marketplace_id: marketplaceId,
      p_taxa_cartao: taxaCartao,
      p_provisao_desconto: provisaoDesconto,
      p_margem_desejada: margemDesejada
    });

    if (error) this.handleError(error, 'Calcular preço');
    
    logger.debug('Resposta da RPC calcular_preco', 'PricingService', data);
    
    // A função retorna um objeto JSON completo, não apenas um número
    return data;
  }

  async calcularMargemReal(productId: string, marketplaceId: string, taxaCartao: number, provisaoDesconto: number, precoPraticado: number): Promise<any> {
    const { data, error } = await supabase.rpc('calcular_margem_real', {
      p_product_id: productId,
      p_marketplace_id: marketplaceId,
      p_taxa_cartao: taxaCartao,
      p_provisao_desconto: provisaoDesconto,
      p_preco_praticado: precoPraticado
    });

    if (error) this.handleError(error, 'Calcular margem real');
    
    logger.debug('Resposta da RPC calcular_margem_real', 'PricingService', data);
    
    // A função retorna um objeto JSON completo, não apenas um número
    return data;
  }

  async upsert(data: Omit<SavedPricingType, 'id' | 'created_at' | 'updated_at'>): Promise<SavedPricingType> {
    const { data: result, error } = await supabase
      .from('saved_pricing')
      .upsert(data, {
        onConflict: 'product_id,marketplace_id',
        ignoreDuplicates: false
      })
      .select()
      .single();
    
    if (error) this.handleError(error, 'Salvar/atualizar precificação');
    return result;
  }

  async recalculateAllPricing(): Promise<{ updated: number; errors: number }> {
    logger.info('Iniciando recálculo automático de todas as precificações...', 'PricingService');
    
    try {
      // Buscar todas as precificações salvas
      const savedPricings = await this.getAllWithDetails();
      
      let updatedCount = 0;
      let errorCount = 0;
      
      // Recalcular cada precificação
      for (const pricing of savedPricings) {
        try {
          // Calcular novo preço
          const newPricing = await this.calcularPreco(
            pricing.product_id,
            pricing.marketplace_id,
            pricing.taxa_cartao,
            pricing.provisao_desconto,
            pricing.margem_desejada
          );

          // Calcular margem real se tiver preço praticado
          let margemReal = null;
          if (pricing.preco_praticado > 0) {
            margemReal = await this.calcularMargemReal(
              pricing.product_id,
              pricing.marketplace_id,
              pricing.taxa_cartao,
              pricing.provisao_desconto,
              pricing.preco_praticado
            );
          }

          // Atualizar precificação com novos valores
          const updatedData = {
            product_id: pricing.product_id,
            marketplace_id: pricing.marketplace_id,
            custo_total: newPricing.custo_total,
            valor_fixo: newPricing.valor_fixo,
            frete: newPricing.frete,
            comissao: newPricing.comissao,
            taxa_cartao: pricing.taxa_cartao,
            provisao_desconto: pricing.provisao_desconto,
            margem_desejada: pricing.margem_desejada,
            preco_sugerido: newPricing.preco_sugerido,
            preco_praticado: pricing.preco_praticado,
            margem_unitaria: newPricing.margem_unitaria,
            margem_percentual: newPricing.margem_percentual
          };

          await this.upsert(updatedData);
          updatedCount++;
          
          logger.debug(`Precificação atualizada: ${pricing.products?.name} - ${pricing.marketplaces?.name}`, 'PricingService');
          
        } catch (error) {
          logger.error(`Erro ao recalcular precificação para produto ${pricing.product_id}`, 'PricingService', error);
          errorCount++;
        }
      }

      logger.info(`Recálculo concluído: ${updatedCount} atualizadas, ${errorCount} erros`, 'PricingService');
      return { updated: updatedCount, errors: errorCount };
      
    } catch (error) {
      logger.error('Erro geral no recálculo automático', 'PricingService', error);
      throw new Error('Falha no recálculo automático das precificações');
    }
  }
}

export const pricingService = new PricingService();