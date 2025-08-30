import { supabase } from '@/integrations/supabase/client';
import { MLService } from '@/services/ml-service';

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface CallOptions {
  operationType?: string;
  skipRateCheck?: boolean;
}

export async function callMLFunction(
  action: string,
  body: Record<string, any>,
  options: CallOptions = {}
) {
  const operationType = options.operationType || action;

  if (!options.skipRateCheck) {
    while (!(await MLService.checkRateLimit(operationType))) {
      await wait(1000);
    }
  }

  const { data, error } = await supabase.functions.invoke('ml-sync-v2', {
    body: { action, ...body }
  });

  if (error) {
    throw new Error(error.message || 'ML function call failed');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

export async function processInBatches<T>(
  items: T[],
  handler: (item: T) => Promise<any>,
  operationType: string,
  concurrency = 3
) {
  const results: PromiseSettledResult<any>[] = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);

    while (!(await MLService.checkRateLimit(operationType))) {
      await wait(1000);
    }

    const settled = await Promise.allSettled(batch.map(handler));
    results.push(...settled);
  }

  return results;
}

