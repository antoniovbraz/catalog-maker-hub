import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base";
import type { Assistant, AssistantFormData } from "@/types/assistants";
import { useLogger } from "@/utils/logger";

export class AssistantsService extends BaseService<Assistant> {
  private logger = useLogger('AssistantsService');

  constructor() {
    super('assistants');
  }

  async createAssistant(data: AssistantFormData): Promise<Assistant> {
    try {
      this.logger.debug('Criando assistente', data);
      
      // Buscar tenant_id do usuário atual
      const { authService } = await import('./auth');
      const tenantId = await authService.getCurrentTenantId();
      
      if (!tenantId) {
        throw new Error('Tenant ID não encontrado');
      }

      // Chamar edge function para criar assistente
      const { data: result, error } = await supabase.functions.invoke('assistants', {
        body: {
          ...data,
          tenant_id: tenantId,
        },
      });

      if (error) {
        this.logger.error('Erro ao criar assistente', error);
        throw new Error(`Falha ao criar assistente: ${error.message}`);
      }

      this.logger.info('Assistente criado com sucesso', result);
      return result as Assistant;
    } catch (error) {
      this.logger.error('Erro na criação do assistente', error);
      throw error;
    }
  }

  async updateAssistant(id: string, data: Partial<AssistantFormData>): Promise<Assistant> {
    try {
      this.logger.debug('Atualizando assistente', { id, data });

      // Chamar edge function para atualizar assistente
      const { data: result, error } = await supabase.functions.invoke(`assistants/${id}`, {
        method: 'PUT',
        body: data,
      });

      if (error) {
        this.logger.error('Erro ao atualizar assistente', error);
        throw new Error(`Falha ao atualizar assistente: ${error.message}`);
      }

      this.logger.info('Assistente atualizado com sucesso', result);
      return result as Assistant;
    } catch (error) {
      this.logger.error('Erro na atualização do assistente', error);
      throw error;
    }
  }

  async deleteAssistant(id: string): Promise<void> {
    try {
      this.logger.debug('Deletando assistente', { id });

      // Chamar edge function para deletar assistente
      const { error } = await supabase.functions.invoke(`assistants/${id}`, {
        method: 'DELETE',
      });

      if (error) {
        this.logger.error('Erro ao deletar assistente', error);
        throw new Error(`Falha ao deletar assistente: ${error.message}`);
      }

      this.logger.info('Assistente deletado com sucesso');
    } catch (error) {
      this.logger.error('Erro na deleção do assistente', error);
      throw error;
    }
  }

  async getAssistantByMarketplace(marketplace: string): Promise<Assistant | null> {
    try {
      this.logger.debug('Buscando assistente por marketplace', { marketplace });

      const { data, error } = await supabase
        .from(this.tableName as any)
        .select('*')
        .eq('marketplace', marketplace)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          this.logger.debug('Nenhum assistente encontrado para o marketplace', { marketplace });
          return null;
        }
        throw error;
      }

      this.logger.debug('Assistente encontrado', data);
      return data as unknown as Assistant;
    } catch (error) {
      this.logger.error('Erro ao buscar assistente por marketplace', error);
      throw new Error(`Buscar assistente por marketplace falhou: ${error.message}`);
    }
  }
}

export const assistantsService = new AssistantsService();