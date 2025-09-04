import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base";
import { CommissionType, CommissionWithDetails, CommissionCalculationParams } from "@/types/commissions";
import { logger } from "@/utils/logger";

export class CommissionsService extends BaseService<CommissionType> {
  constructor() {
    super('commissions');
  }

  async getAllWithDetails(): Promise<CommissionWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('commissions')
        .select(`
          *,
          marketplaces:marketplace_id (
            id,
            name
          ),
          categories:category_id (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) this.handleError(error, 'Buscar comissões com detalhes');
      return data || [];
    } catch (error) {
      logger.error('Erro ao buscar comissões com detalhes', new Error(String(error)), { source: 'CommissionsService' });
      throw error;
    }
  }

  async getByMarketplace(marketplaceId: string): Promise<CommissionType[]> {
    try {
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('marketplace_id', marketplaceId)
        .order('rate', { ascending: false });
      
      if (error) this.handleError(error, 'Buscar comissões por marketplace');
      return data || [];
    } catch (error) {
      logger.error('Erro ao buscar comissões por marketplace', new Error(String(error)), { source: 'CommissionsService' });
      throw error;
    }
  }

  async getByCategory(categoryId: string): Promise<CommissionType[]> {
    try {
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('category_id', categoryId)
        .order('rate', { ascending: false });
      
      if (error) this.handleError(error, 'Buscar comissões por categoria');
      return data || [];
    } catch (error) {
      logger.error('Erro ao buscar comissões por categoria', new Error(String(error)), { source: 'CommissionsService' });
      throw error;
    }
  }

  async findApplicableCommission({ marketplaceId, categoryId }: CommissionCalculationParams): Promise<CommissionType | null> {
    try {
      // Primeiro, tenta encontrar uma comissão específica para a categoria
      if (categoryId) {
        const { data: specificCommission, error: specificError } = await supabase
          .from('commissions')
          .select('*')
          .eq('marketplace_id', marketplaceId)
          .eq('category_id', categoryId)
          .single();

        if (!specificError && specificCommission) {
          return specificCommission;
        }
      }

      // Se não encontrou específica, busca a comissão padrão (category_id = null)
      const { data: defaultCommission, error: defaultError } = await supabase
        .from('commissions')
        .select('*')
        .eq('marketplace_id', marketplaceId)
        .is('category_id', null)
        .single();

      if (defaultError) {
        logger.warn('Nenhuma comissão padrão encontrada', { source: 'CommissionsService', marketplaceId, categoryId });
        return null;
      }

      return defaultCommission;
    } catch (error) {
      logger.error('Erro ao buscar comissão aplicável', new Error(String(error)), { source: 'CommissionsService' });
      throw error;
    }
  }

  async validateUniqueRule(marketplaceId: string, categoryId: string | null, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('commissions')
        .select('id')
        .eq('marketplace_id', marketplaceId);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      } else {
        query = query.is('category_id', null);
      }

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;
      
      if (error) this.handleError(error, 'Validar regra única de comissão');
      return (data?.length || 0) === 0;
    } catch (error) {
      logger.error('Erro ao validar regra única', new Error(String(error)), { source: 'CommissionsService' });
      throw error;
    }
  }

  async calculateCommissionRate(marketplaceId: string, categoryId?: string | null): Promise<number> {
    try {
      const commission = await this.findApplicableCommission({ marketplaceId, categoryId });
      return commission?.rate || 0;
    } catch (error) {
      logger.error('Erro ao calcular taxa de comissão', new Error(String(error)), { source: 'CommissionsService' });
      return 0; // Retorna 0 em caso de erro para não quebrar cálculos
    }
  }
}

export const commissionsService = new CommissionsService();