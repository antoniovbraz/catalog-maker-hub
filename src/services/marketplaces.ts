import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base";
import { MarketplaceType, MarketplaceHierarchy } from "@/types/marketplaces";

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
    
    // Encontrar plataformas (marketplace_type = 'platform')
    const platforms = allMarketplaces.filter(m => m.marketplace_type === 'platform');
    
    // Para cada plataforma, encontrar suas modalidades
    platforms.forEach(platform => {
      const modalities = allMarketplaces.filter(m => m.platform_id === platform.id);
      hierarchies.push({ parent: platform, children: modalities });
    });
    
    // Adicionar modalidades órfãs (sem plataforma pai)
    const orphanModalities = allMarketplaces.filter(m => 
      m.marketplace_type === 'modality' && 
      !m.platform_id
    );
    
    orphanModalities.forEach(orphan => {
      hierarchies.push({ parent: orphan, children: [] });
    });
    
    return hierarchies;
  }

  async getPlatforms(): Promise<MarketplaceType[]> {
    const { data, error } = await supabase
      .from('marketplaces')
      .select('*')
      .eq('marketplace_type', 'platform')
      .order('name');
    
    if (error) this.handleError(error, 'Buscar plataformas');
    return data || [];
  }

  async getModalitiesByPlatform(platformId: string, categoryId?: string): Promise<MarketplaceType[]> {
    let query = supabase
      .from('marketplaces')
      .select('*')
      .eq('platform_id', platformId)
      .eq('marketplace_type', 'modality');
    
    const { data, error } = await query.order('name');
    
    if (error) this.handleError(error, 'Buscar modalidades da plataforma');
    
    // Filtrar por categoria se especificada
    if (categoryId && data) {
      return data.filter(modality => {
        if (!modality.category_restrictions || (Array.isArray(modality.category_restrictions) && modality.category_restrictions.length === 0)) {
          return true; // Sem restrições = todas as categorias
        }
        // Verificar se a categoria está nas restrições
        return Array.isArray(modality.category_restrictions) && modality.category_restrictions.includes(categoryId);
      });
    }
    
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