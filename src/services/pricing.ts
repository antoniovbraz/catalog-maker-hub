import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base";
import { SavedPricingType, PricingCalculationParams, MargemRealParams } from "@/types/pricing";

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
    
    console.log('Resposta da RPC calcular_preco:', data);
    
    // A função retorna um objeto JSON completo, não apenas um número
    return data;
  }

  async calcularMargemReal(productId: string, marketplaceId: string, taxaCartao: number, provisaoDesconto: number, precoPraticado: number): Promise<number> {
    const { data, error } = await supabase.rpc('calcular_margem_real', {
      p_product_id: productId,
      p_marketplace_id: marketplaceId,
      p_taxa_cartao: taxaCartao,
      p_provisao_desconto: provisaoDesconto,
      p_preco_praticado: precoPraticado
    });

    if (error) this.handleError(error, 'Calcular margem real');
    return typeof data === 'number' ? data : 0;
  }
}

export const pricingService = new PricingService();