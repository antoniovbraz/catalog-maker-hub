import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base";
import { MarketplaceType } from "@/types/marketplaces";

export class MarketplacesService extends BaseService<MarketplaceType> {
  constructor() {
    super('marketplaces');
  }

  async getActive(): Promise<MarketplaceType[]> {
    const { data, error } = await supabase
      .from('marketplaces')
      .select('*')
      .order('name');
    
    if (error) this.handleError(error, 'Buscar marketplaces ativos');
    return data || [];
  }

  async validateName(name: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('marketplaces')
      .select('id')
      .eq('name', name);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) this.handleError(error, 'Validar nome do marketplace');
    return (data?.length || 0) === 0;
  }
}

export const marketplacesService = new MarketplacesService();