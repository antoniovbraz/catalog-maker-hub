import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base";
import type { Assistant, AssistantFormData } from "@/types/assistants";
import { logger } from "@/utils/logger";

export class AssistantsService extends BaseService<Assistant> {
  private logger = logger;

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
      const { data: result, error } = await supabase.functions.invoke<Assistant>(
        "assistants",
        {
          body: {
            ...data,
            tenant_id: tenantId,
          },
        },
      );

      if (error) {
        this.logger.error("Erro ao criar assistente", error);
        throw new Error(`Falha ao criar assistente: ${error.message}`);
      }

      this.logger.info("Assistente criado com sucesso", result);
      return result as Assistant;
    } catch (error) {
      this.logger.error('Erro na criação do assistente', error);
      throw error;
    }
  }

  async updateAssistant(id: string, data: Partial<AssistantFormData>): Promise<Assistant> {
    try {
      this.logger.debug('Atualizando assistente', { id, data });

      const { data: result, error } = await supabase.functions.invoke<Assistant>(
        `assistants/${id}`,
        {
          method: "PUT",
          body: data,
        },
      );

      if (error) {
        this.logger.error("Erro ao atualizar assistente", error);
        throw new Error(`Falha ao atualizar assistente: ${error.message}`);
      }

      this.logger.info("Assistente atualizado com sucesso", result);
      return result as Assistant;
    } catch (error) {
      this.logger.error('Erro na atualização do assistente', error);
      throw error;
    }
  }

  async deleteAssistant(id: string): Promise<void> {
    try {
      this.logger.debug('Deletando assistente', { id });

      const { error } = await supabase.functions.invoke<null>(`assistants/${id}`, {
        method: "DELETE",
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

  async getAssistantByMarketplace(
    marketplace: Assistant["marketplace"],
  ): Promise<Assistant | null> {
    try {
      this.logger.debug('Buscando assistente por marketplace', { marketplace });

      const { data, error } = await supabase
        .from<Assistant>("assistants")
        .select("*")
        .eq("marketplace", marketplace)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        this.logger.debug("Nenhum assistente encontrado para o marketplace", { marketplace });
        return null;
      }

      this.logger.debug("Assistente encontrado", data);
      return data;
    } catch (error) {
      this.logger.error('Erro ao buscar assistente por marketplace', error);
      if (error instanceof Error) {
        throw new Error(`Buscar assistente por marketplace falhou: ${error.message}`);
      }
      throw new Error('Buscar assistente por marketplace falhou: erro desconhecido');
    }
  }
}

export const assistantsService = new AssistantsService();