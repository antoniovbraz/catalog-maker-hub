import { supabase } from "@/integrations/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";
import { authService } from "./auth";

export abstract class BaseService<T = any> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async getAll(): Promise<T[]> {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Erro ao buscar ${this.tableName}: ${error.message}`);
    return (data as T[]) || [];
  }

  async getById(id: string): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName as any)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Erro ao buscar ${this.tableName} por ID: ${error.message}`);
    }
    return data as T;
  }

  async create(data: Partial<T>): Promise<T> {
    // Adicionar tenant_id automaticamente se a tabela suporta
    const dataWithTenant = await this.addTenantId(data);
    
    const { data: result, error } = await supabase
      .from(this.tableName as any)
      .insert(dataWithTenant as any)
      .select()
      .single();
    
    if (error) throw new Error(`Erro ao criar ${this.tableName}: ${error.message}`);
    return result as T;
  }

  protected async addTenantId(data: Partial<T>): Promise<Partial<T>> {
    // Tabelas que precisam de tenant_id
    const tablesWithTenant = [
      'products', 'categories', 'marketplaces', 'sales', 
      'saved_pricing', 'commissions', 'marketplace_fixed_fee_rules', 'shipping_rules'
    ];
    
    if (tablesWithTenant.includes(this.tableName)) {
      const tenantId = await authService.getCurrentTenantId();
      if (tenantId) {
        return { ...data, tenant_id: tenantId } as Partial<T>;
      }
    }
    
    return data;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const { data: result, error } = await supabase
      .from(this.tableName as any)
      .update(data as any)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Erro ao atualizar ${this.tableName}: ${error.message}`);
    return result as T;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName as any)
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Erro ao deletar ${this.tableName}: ${error.message}`);
  }

  protected handleError(error: PostgrestError, operation: string): never {
    console.error(`${operation} error in ${this.tableName}:`, error);
    throw new Error(`${operation} falhou: ${error.message}`);
  }
}