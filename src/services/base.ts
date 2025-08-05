import { supabase } from "@/integrations/supabase/client";
import { useLogger } from "@/utils/logger";

export abstract class BaseService<T extends { id: string; tenant_id?: string }> {
  protected tableName: string;
  protected logger = useLogger('BaseService');

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async getAll(): Promise<T[]> {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) this.handleError(error, `Buscar ${this.tableName}`);
    return (data as unknown as T[]) || [];
  }

  async getById(id: string): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      this.handleError(error, `Buscar ${this.tableName} por ID`);
    }
    return data as unknown as T;
  }

  async create(data: Partial<T>): Promise<T> {
    // Adicionar tenant_id automaticamente se a tabela suporta
    const dataWithTenant = await this.addTenantId(data);
    
    const { data: result, error } = await supabase
      .from(this.tableName as any)
      .insert(dataWithTenant)
      .select()
      .single();

    if (error) this.handleError(error, `Criar ${this.tableName}`);
    return result as unknown as T;
  }

  protected async addTenantId(data: Partial<T>): Promise<Partial<T>> {
    // Tabelas que precisam de tenant_id
    const tablesWithTenant = [
      'categories', 'products', 'marketplaces', 'commissions', 
      'sales', 'saved_pricing', 'shipping_rules', 'marketplace_fixed_fee_rules',
      'product_images', 'assistants', 'usage_tracking'
    ];

    if (!tablesWithTenant.includes(this.tableName)) {
      return data;
    }

    // Se já tem tenant_id, usar o fornecido
    if (data.tenant_id) {
      return data;
    }

    // Buscar tenant_id do usuário atual
    const { authService } = await import('./auth');
    const tenantId = await authService.getCurrentTenantId();
    
    if (!tenantId) {
      throw new Error('Tenant ID não encontrado');
    }

    return {
      ...data,
      tenant_id: tenantId,
    };
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const { data: result, error } = await supabase
      .from(this.tableName as any)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) this.handleError(error, `Atualizar ${this.tableName}`);
    return result as unknown as T;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName as any)
      .delete()
      .eq('id', id);

    if (error) this.handleError(error, `Deletar ${this.tableName}`);
  }

  protected handleError(error: any, operation: string): never {
    this.logger.error(`${operation} falhou:`, error);
    throw new Error(`${operation} falhou: ${error.message}`);
  }
}