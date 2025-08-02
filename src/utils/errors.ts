export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ServiceError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'ServiceError';
  }
}

export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PricingError';
  }
}

/**
 * Manipula erros do Supabase e retorna mensagens amigáveis
 */
export function handleSupabaseError(error: any): string {
  if (error?.code === 'PGRST116') {
    return 'Registro não encontrado';
  }
  
  if (error?.code === '23505') {
    return 'Já existe uma regra para esta combinação de marketplace e categoria';
  }
  
  if (error?.code === '23503') {
    return 'Não é possível deletar: existem registros relacionados';
  }
  
  if (error?.message?.includes('duplicate key')) {
    return 'Já existe um registro com essas informações';
  }
  
  if (error?.message?.includes('foreign key')) {
    return 'Referência inválida: verifique os dados relacionados';
  }
  
  if (error?.message?.includes('invalid input syntax for type uuid')) {
    return 'ID inválido fornecido. Verifique os dados selecionados';
  }
  
  if (error?.message?.includes('violates check constraint')) {
    return 'Dados inválidos: verifique se todos os valores estão dentro dos limites permitidos';
  }
  
  return error?.message || 'Erro inesperado';
}

/**
 * Log de erro para desenvolvimento
 */
export function logError(error: Error, context?: string): void {
  console.error(`[${context || 'ERROR'}]:`, {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
}