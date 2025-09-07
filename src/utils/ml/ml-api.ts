import { supabase } from '@/integrations/supabase/client';

// Rate limiting e gestão de chamadas para ML API
const RATE_LIMITS = {
  sync_product: { max: 60, window: 60 * 1000 }, // 60 por minuto
  resync_product: { max: 30, window: 60 * 1000 }, // 30 por minuto
  import_from_ml: { max: 5, window: 60 * 1000 }, // 5 por minuto
  default: { max: 30, window: 60 * 1000 },
};

const callHistory = new Map<string, number[]>();

export interface MLCallOptions {
  skipRateCheck?: boolean;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Verifica se uma operação pode ser executada com base no rate limit
 */
function canMakeCall(functionName: string, action: string): boolean {
  const limit = RATE_LIMITS[action as keyof typeof RATE_LIMITS] || RATE_LIMITS.default;
  const operationKey = `${functionName}:${action}`;
  const now = Date.now();
  const windowStart = now - limit.window;

  if (!callHistory.has(operationKey)) {
    callHistory.set(operationKey, []);
  }

  const calls = callHistory.get(operationKey)!;

  // Remove chamadas fora da janela
  const recentCalls = calls.filter(time => time > windowStart);
  callHistory.set(operationKey, recentCalls);

  return recentCalls.length < limit.max;
}

/**
 * Registra uma chamada no histórico
 */
function recordCall(functionName: string, action: string): void {
  const operationKey = `${functionName}:${action}`;
  if (!callHistory.has(operationKey)) {
    callHistory.set(operationKey, []);
  }

  callHistory.get(operationKey)!.push(Date.now());
}

/**
 * Chama uma função ML com rate limiting e error handling melhorado
 */
export async function callMLFunction(
  functionName: string,
  action: string,
  params: Record<string, unknown> = {},
  options: MLCallOptions = {}
): Promise<unknown> {
  const {
    skipRateCheck = false,
    timeout = action === 'import_from_ml' ? 120000 : 30000, // 2 min for imports, 30s for others
    headers = {}
  } = options;

  // Verificar rate limit se não for para pular
  if (!skipRateCheck && !canMakeCall(functionName, action)) {
    const limit = RATE_LIMITS[action as keyof typeof RATE_LIMITS] || RATE_LIMITS.default;
    throw new Error(`Rate limit excedido para ${action}. Máximo ${limit.max} chamadas por ${limit.window / 1000}s.`);
  }
  
  try {
    console.log(`[ML API] Calling ${action} with params:`, params);
    
    // Criar uma promise com timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout após ${timeout}ms`)), timeout);
    });
    
    const { data: session } = await supabase.auth.getSession();
    const authHeader = session.session?.access_token
      ? { Authorization: `Bearer ${session.session.access_token}` }
      : undefined;

    const callPromise = supabase.functions
      .invoke(functionName, {
        body: { action, ...params },
        headers: authHeader && typeof authHeader === 'object' ? { ...authHeader, ...headers } : headers,
      })
      // Evita rejeições não tratadas quando o timeout ocorre primeiro
      .catch((err: { message?: string }) => ({ data: null, error: err }));

    const { data, error } = (await Promise.race([
      callPromise,
      timeoutPromise,
    ])) as {
      data: unknown;
      error: { message?: string; name?: string; context?: unknown } | null;
    };

    if (error) {
      console.error(`[ML API] Error in ${action}:`, error);

      let message: string | undefined;

      // Tenta extrair mensagem do payload quando FunctionsHttpError é retornado
      if (error.name === 'FunctionsHttpError' && error.context) {
        try {
          interface ErrorContext {
            text?: () => Promise<string>;
            [key: string]: unknown;
          }
          const ctx = error.context as ErrorContext;
          type Payload = { error?: unknown; message?: string };
          let payload: Payload | undefined = ctx as Payload;

          if (typeof ctx?.text === 'function') {
            const text = await ctx.text();
            payload = JSON.parse(text);
          } else if (typeof ctx === 'string') {
            payload = JSON.parse(ctx);
          }

          const payloadError =
            (typeof payload?.error === 'object'
              ? (payload.error as { message?: string })?.message
              : (payload?.error as string | undefined)) ||
            payload?.message;
          if (payloadError) {
            message = String(payloadError);
          }
        } catch (parseErr) {
          console.error('[ML API] Failed to parse error context:', parseErr);
        }
      }

      if (!message) {
        interface InvokeError {
          message?: string;
          details?: { message?: string };
          error?: { message?: string };
        }

        const invokeError = error as InvokeError;
        const details = invokeError.details || invokeError.error;
        message = details?.message || invokeError.message || `Erro na operação ${action}`;
      }

      throw new Error(message);
    }
    
    // Registrar a chamada como sucesso
    recordCall(functionName, action);
    
    console.log(`[ML API] Success in ${action}:`, data);
    return data;
    
  } catch (error) {
    console.error(`[ML API] Exception in ${action}:`, error);
    
    // Registrar a tentativa mesmo com erro para rate limiting
    recordCall(functionName, action);
    
    // Melhorar a mensagem de erro
    let errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    if (errorMessage.toLowerCase().includes('timeout')) {
      errorMessage = `Operação ${action} demorou muito para responder`;
    } else if (errorMessage.includes('network')) {
      errorMessage = `Erro de conexão durante ${action}`;
    } else if (errorMessage.includes('unauthorized')) {
      errorMessage = 'Token do Mercado Livre expirado ou inválido';
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Processa uma lista de IDs em lotes com controle de rate limiting
 */
export async function processInBatches<T>(
  items: string[],
  processor: (item: string) => Promise<T>,
  operation: string,
  batchSize: number = 3,
  delayBetweenBatches: number = 1000
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];
  
  console.log(`[ML API] Processing ${items.length} items in batches of ${batchSize} for ${operation}`);
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(`[ML API] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}`);
    
    const batchPromises = batch.map(async (item) => {
      try {
        return await processor(item);
      } catch (error) {
        console.error(`[ML API] Error processing item ${item}:`, error);
        throw error;
      }
    });
    
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults);
    
    // Delay entre lotes para evitar rate limiting
    if (i + batchSize < items.length) {
      console.log(`[ML API] Waiting ${delayBetweenBatches}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`[ML API] Batch processing completed: ${successful} successful, ${failed} failed`);
  
  return results;
}

/**
 * Limpa o histórico de chamadas (útil para testes)
 */
export function clearCallHistory(): void {
  callHistory.clear();
}

/**
 * Obtém estatísticas do rate limiting atual
 */
export function getRateLimitStats(): Record<string, { calls: number; limit: number; windowMs: number }> {
  const stats: Record<string, { calls: number; limit: number; windowMs: number }> = {};
  
  for (const [operationKey, calls] of callHistory.entries()) {
    const [, action] = operationKey.split(':');
    const limit = RATE_LIMITS[action as keyof typeof RATE_LIMITS] || RATE_LIMITS.default;
    const now = Date.now();
    const windowStart = now - limit.window;
    const recentCalls = calls.filter(time => time > windowStart);

    stats[operationKey] = {
      calls: recentCalls.length,
      limit: limit.max,
      windowMs: limit.window,
    };
  }
  
  return stats;
}