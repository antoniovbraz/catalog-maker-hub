import { ActionContext, GetStatusRequest, errorResponse, corsHeaders } from '../types.ts';

export async function getStatus(
  _req: GetStatusRequest,
  { supabase, tenantId }: ActionContext
): Promise<Response> {
  try {
    // Obter status dos produtos ML com informações completas
    const { data: mappings, error: mappingsError } = await supabase
      .from('ml_product_mapping')
      .select(`
        id,
        sync_status,
        last_sync_at,
        error_message,
        products!inner (
          id,
          name,
          sku,
          source
        )
      `)
      .eq('tenant_id', tenantId);

    if (mappingsError) {
      console.error('Mappings query error:', mappingsError);
      return errorResponse('Failed to get sync status', 500);
    }

    // Contar status
    const statusCounts = {
      total_products: mappings?.length || 0,
      synced_products: mappings?.filter(m => m.sync_status === 'synced').length || 0,
      pending_products: mappings?.filter(m => m.sync_status === 'pending').length || 0,
      error_products: mappings?.filter(m => m.sync_status === 'error').length || 0,
      not_synced_products: mappings?.filter(m => m.sync_status === 'not_synced').length || 0,
    };

    // Calcular última sincronização
    const lastSyncDates = mappings
      ?.filter(m => m.last_sync_at)
      .map(m => new Date(m.last_sync_at))
      .sort((a, b) => b.getTime() - a.getTime());

    const lastSync = lastSyncDates && lastSyncDates.length > 0 
      ? lastSyncDates[0].toISOString() 
      : null;

    // Obter estatísticas de operações recentes (últimas 24h)
    const { data: recentLogs, error: logsError } = await supabase
      .from('ml_sync_log')
      .select('status, operation_type, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    let operationStats = {
      successful_24h: 0,
      failed_24h: 0,
      total_24h: 0,
    };

    if (!logsError && recentLogs) {
      operationStats = {
        successful_24h: recentLogs.filter(log => log.status === 'success').length,
        failed_24h: recentLogs.filter(log => log.status === 'error').length,
        total_24h: recentLogs.length,
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...statusCounts,
        last_sync: lastSync,
        ...operationStats,
        health_status: statusCounts.error_products > 0 ? 'warning' : 
                      statusCounts.synced_products === 0 ? 'idle' : 'healthy',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get status error:', error);
    return errorResponse('Internal server error', 500);
  }
}