import { ActionContext, ImportFromMLRequest } from '../types.ts';
import { fetchWithRetry } from '../../shared/fetchWithRetry.ts';

// Weight parsing helpers

export function parseWeight(valueName: string): { value: number; unit: string } | null {
  if (!valueName) return null;
  
  const weightRegex = /^(\d+(?:[.,]\d+)?)\s*(g|kg|oz|lbs?)\b/i;
  const match = valueName.match(weightRegex);
  
  if (match) {
    const value = parseFloat(match[1].replace(',', '.'));
    const unit = match[2].toLowerCase();
    return { value, unit };
  }
  
  return null;
}

export function weightToGrams(value: number, unit: string): number {
  switch (unit.toLowerCase()) {
    case 'kg': return value * 1000;
    case 'oz': return value * 28.35;
    case 'lb':
    case 'lbs': return value * 453.59;
    case 'g':
    default: return value;
  }
}

function parseCost(saleTerms: Array<{ id: string; value_name?: string }>): number {
  const costTerm = saleTerms?.find(term => term.id === 'INVOICE_COST_PRICE');
  if (costTerm?.value_name) {
    const numericValue = parseFloat(costTerm.value_name.replace(/[^\d.,]/g, '').replace(',', '.'));
    return isNaN(numericValue) ? 0 : numericValue;
  }
  return 0;
}

export async function importFromML(
  _req: ImportFromMLRequest,
  { supabase, tenantId, mlToken }: ActionContext
): Promise<Response> {
  console.log('Starting ML import with optimized batch processing');
  
  const startTime = Date.now();
  let totalProcessed = 0;
  let totalSuccessful = 0;
  let totalFailed = 0;
  const allErrors: string[] = [];

  try {
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      console.log(`Fetching items batch: offset=${offset}, limit=${limit}`);
      
      const response = await fetchWithRetry(
        `https://api.mercadolibre.com/users/me/items/search?status=active&offset=${offset}&limit=${limit}`,
        { headers: { 'Authorization': `Bearer ${mlToken}` } }
      );

      if (!response.ok) {
        throw new Error(`ML API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const items = Array.from(new Set(data.results || []));
      const total = data.paging?.total ?? 0;

      if (items.length === 0) break;

      // Process items in parallel batches of 5
      for (let i = 0; i < items.length; i += 5) {
        const batch = items.slice(i, i + 5);
        const batchResults = await Promise.allSettled(
          batch.map((itemId: string) => processMLItem(itemId, { supabase, tenantId, mlToken }))
        );
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            totalSuccessful++;
          } else {
            totalFailed++;
            allErrors.push(`Item ${batch[index]}: ${result.reason?.message || 'Unknown error'}`);
          }
        });
        
        totalProcessed += batch.length;
      }

      hasMore = offset + limit < total;
      offset += limit;
    }

    const executionTime = Date.now() - startTime;
    console.log(`Import completed: ${totalSuccessful} processed, ${totalFailed} errors in ${executionTime}ms`);

    await supabase.from('ml_sync_log').insert({
      tenant_id: tenantId,
      operation_type: 'import_from_ml',
      entity_type: 'batch',
      status: totalFailed === 0 ? 'success' : 'partial_success',
      response_data: { totalProcessed, totalSuccessful, totalFailed, executionTime },
      execution_time_ms: executionTime
    });

    return new Response(JSON.stringify({
      success: true,
      total_processed: totalProcessed,
      successful: totalSuccessful,
      failed: totalFailed,
      execution_time: executionTime
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const executionTime = Date.now() - startTime;
    console.error('Import failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    return new Response(JSON.stringify({
      success: false,
      error: message,
      execution_time: executionTime
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function processMLItem(
  itemId: string,
  { supabase, tenantId, mlToken }: { supabase: ActionContext['supabase']; tenantId: string; mlToken: string }
): Promise<void> {
  // Check if mapping exists
  const { data: existingMapping } = await supabase
    .from('ml_product_mapping')
    .select('product_id')
    .eq('tenant_id', tenantId)
    .eq('ml_item_id', itemId)
    .single();

  if (existingMapping) {
    // Skip resync for existing items during import to improve performance
    return;
  }

  // Get item details
  const itemResponse = await fetchWithRetry(`https://api.mercadolibre.com/items/${itemId}`, {
    headers: { 'Authorization': `Bearer ${mlToken}` }
  });
  
  if (!itemResponse.ok) throw new Error(`Failed to fetch item ${itemId}`);
  
  const item = await itemResponse.json();
  
  // Create product and mapping
  const { data: newProduct } = await supabase.from('products').upsert({
    tenant_id: tenantId,
    name: item.title,
    cost_unit: parseCost(item.sale_terms || []),
    source: 'mercado_livre',
    category_ml_id: item.category_id,
    updated_from_ml_at: new Date().toISOString(),
  }).select('id').single();

  if (newProduct) {
    await supabase.from('ml_product_mapping').upsert({
      tenant_id: tenantId,
      product_id: newProduct.id,
      ml_item_id: itemId,
      ml_title: item.title,
      ml_price: item.price,
      sync_status: 'synced',
      last_sync_at: new Date().toISOString(),
    });
  }
}