import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base";
import { MarketplaceType, MarketplaceWithChildren, MarketplaceHierarchy } from "@/types/marketplaces";

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

  async getHierarchical(): Promise<MarketplaceHierarchy[]> {
    const { data, error } = await supabase
      .from('marketplaces')
      .select('*')
      .order('name');
    
    if (error) this.handleError(error, 'Buscar marketplaces hierárquicos');
    
    const allMarketplaces = data || [];
    const hierarchies: MarketplaceHierarchy[] = [];
    
    // Encontrar marketplaces pais (sem parent_marketplace_id)
    const parents = allMarketplaces.filter(m => !m.parent_marketplace_id);
    
    // Para cada pai, encontrar seus filhos
    parents.forEach(parent => {
      const children = allMarketplaces.filter(m => m.parent_marketplace_id === parent.id);
      hierarchies.push({ parent, children });
    });
    
    // Adicionar marketplaces sem hierarquia (que não são pais nem filhos)
    const orphans = allMarketplaces.filter(m => 
      !m.parent_marketplace_id && 
      !allMarketplaces.some(child => child.parent_marketplace_id === m.id)
    );
    
    orphans.forEach(orphan => {
      hierarchies.push({ parent: orphan, children: [] });
    });
    
    return hierarchies;
  }

  async getParents(): Promise<MarketplaceType[]> {
    const { data, error } = await supabase
      .from('marketplaces')
      .select('*')
      .is('parent_marketplace_id', null)
      .order('name');
    
    if (error) this.handleError(error, 'Buscar marketplaces pais');
    return data || [];
  }

  async getChildren(parentId: string): Promise<MarketplaceType[]> {
    const { data, error } = await supabase
      .from('marketplaces')
      .select('*')
      .eq('parent_marketplace_id', parentId)
      .order('name');
    
    if (error) this.handleError(error, 'Buscar marketplaces filhos');
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