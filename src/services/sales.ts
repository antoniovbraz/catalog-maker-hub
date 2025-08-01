import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base";
import { SaleType, SaleWithDetails } from "@/types/sales";

export class SalesService extends BaseService<SaleType> {
  constructor() {
    super('sales');
  }

  async getAllWithDetails(): Promise<SaleWithDetails[]> {
    const { data, error } = await supabase
      .from('sales')
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
      .order('sold_at', { ascending: false });
    
    if (error) this.handleError(error, 'Buscar vendas com detalhes');
    return data || [];
  }

  async getByDateRange(startDate: string, endDate: string): Promise<SaleWithDetails[]> {
    const { data, error } = await supabase
      .from('sales')
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
      .gte('sold_at', startDate)
      .lte('sold_at', endDate)
      .order('sold_at', { ascending: false });
    
    if (error) this.handleError(error, 'Buscar vendas por período');
    return data || [];
  }

  async getByProduct(productId: string): Promise<SaleWithDetails[]> {
    const { data, error } = await supabase
      .from('sales')
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
      .eq('product_id', productId)
      .order('sold_at', { ascending: false });
    
    if (error) this.handleError(error, 'Buscar vendas por produto');
    return data || [];
  }

  async getByMarketplace(marketplaceId: string): Promise<SaleWithDetails[]> {
    const { data, error } = await supabase
      .from('sales')
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
      .eq('marketplace_id', marketplaceId)
      .order('sold_at', { ascending: false });
    
    if (error) this.handleError(error, 'Buscar vendas por marketplace');
    return data || [];
  }
}

export const salesService = new SalesService();