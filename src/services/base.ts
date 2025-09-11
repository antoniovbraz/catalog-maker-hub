import { supabase } from "@/integrations/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

export abstract class BaseService<T = Record<string, unknown>> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async getAll(): Promise<T[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) this.handleError(error, `Buscar ${this.tableName}`);
    return (data as T[]) || [];
  }

  async getById(id: string): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      this.handleError(error, `Buscar ${this.tableName} por ID`);
    }
    return data as T;
  }

  // CORREÇÃO CRÍTICA: Remover addTenantId automático que causava dependência circular
  async create(data: Partial<T>): Promise<T> {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(data as Partial<T>)
      .select()
      .single();

    if (error) this.handleError(error, `Criar ${this.tableName}`);
    return result as T;
  }

  // MÉTODO OPCIONAL: Usar apenas quando tenant_id é explicitamente fornecido
  async createWithTenant(data: Partial<T>, tenantId: string): Promise<T> {
    const dataWithTenant = { ...data, tenant_id: tenantId } as Partial<T>;
    
    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(dataWithTenant)
      .select()
      .single();

    if (error) this.handleError(error, `Criar ${this.tableName} com tenant`);
    return result as T;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .update(data as Partial<T>)
      .eq('id', id)
      .select()
      .single();

    if (error) this.handleError(error, `Atualizar ${this.tableName}`);
    return result as T;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) this.handleError(error, `Deletar ${this.tableName}`);
  }

  protected handleError(error: PostgrestError, operation: string): never {
    logger.error(`BaseService.${this.tableName}`, `${operation} falhou`, {
      errorCode: error.code,
      errorMessage: error.message,
      operation,
      table: this.tableName
    });
    throw new Error(`${operation} falhou: ${error.message}`);
  }
}