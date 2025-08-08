/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base";
import type { Assistant, AssistantFormData } from "@/types/assistants";
import { useLogger } from "@/utils/logger";

export class AssistantsService extends BaseService<Assistant> {
  private logger = useLogger('AssistantsService');

  constructor() {
    super('assistants');
  }

  // Método para fazer requisições HTTP com retry e timeout
  private async makeRequest(method: string, endpoint: string, body?: unknown): Promise<unknown> {
    const maxRetries = 3;
    const timeout = 30000; // 30 segundos
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(`Tentativa ${attempt}/${maxRetries} - ${method} ${endpoint}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Usuário não autenticado');
        }

        const response = await fetch(`https://ngkhzbzynkhgezkqykeb.supabase.co/functions/v1/${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5na2h6Ynp5bmtoZ2V6a3F5a2ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMDM3ODgsImV4cCI6MjA2OTU3OTc4OH0.EMk6edTPpwvcy_6VVDxARgoRsJrY9EiijbfR4dFDQAQ',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        this.logger.debug(`Sucesso na tentativa ${attempt}`, result);
        return result;

      } catch (error: unknown) {
        this.logger.error(`Erro na tentativa ${attempt}/${maxRetries}`, error);
        
        if (attempt === maxRetries) {
          // Se é a última tentativa, relançar o erro
            if (error instanceof Error) {
              if (error.name === 'AbortError') {
                throw new Error('Timeout na requisição - tente novamente');
              }
              if (error.message.includes('SSL') || error.message.includes('handshake')) {
                throw new Error('Erro de conectividade SSL - tente novamente em alguns minutos');
              }
            }
            throw error;
        }
        
        // Aguardar antes de tentar novamente (backoff exponencial)
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        this.logger.debug(`Aguardando ${delay}ms antes da próxima tentativa`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
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

      // Usar fetch direto para PUT com retry e timeout
        const result = await this.makeRequest('PUT', `assistants/${id}`, data);
      
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

      // Usar fetch direto para DELETE com retry e timeout
      await this.makeRequest('DELETE', `assistants/${id}`);
      
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
        .from('assistants' as any)
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
      if (error instanceof Error) {
        throw new Error(`Buscar assistente por marketplace falhou: ${error.message}`);
      }
      throw new Error('Buscar assistente por marketplace falhou: erro desconhecido');
    }
  }
}

export const assistantsService = new AssistantsService();