import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { setupLogger } from '../shared/logger.ts';
import { corsHeaders, handleCors } from '../shared/cors.ts';
import { checkEnv } from '../../../edges/_shared/checkEnv.ts';

console.log('ML Security Monitor initialized');

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  checkEnv();

  setupLogger(req.headers);
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Use service role for security monitoring
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('Starting ML security and health monitoring...');
    
    const securityReport = {
      timestamp: new Date().toISOString(),
      checks: [],
      issues: [],
      recommendations: []
    };

    // 1. Check for suspicious activity patterns
    const { data: suspiciousActivity } = await supabase
      .from('ml_sync_log')
      .select('tenant_id, operation_type, status, created_at, error_details')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24h
      .eq('status', 'error')
      .limit(100);

    // Analyze patterns
    const errorCounts = {};
    suspiciousActivity?.forEach(log => {
      const key = `${log.tenant_id}-${log.operation_type}`;
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });

    // Flag tenants with high error rates
    Object.entries(errorCounts).forEach(([key, count]) => {
      if (count > 10) { // More than 10 errors in 24h for same operation
        const [tenantId, operationType] = key.split('-');
        securityReport.issues.push({
          type: 'high_error_rate',
          tenant_id: tenantId,
          operation_type: operationType,
          error_count: count,
          severity: 'medium'
        });
      }
    });

    // 2. Check for tokens about to expire without refresh
    const { data: expiringTokens } = await supabase
      .from('ml_auth_tokens_decrypted')
      .select('tenant_id, expires_at, user_id_ml')
      .lt('expires_at', new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()) // Expires in 2h
      .gt('expires_at', new Date().toISOString()); // Not already expired

    expiringTokens?.forEach(token => {
      securityReport.issues.push({
        type: 'token_expiring_soon',
        tenant_id: token.tenant_id,
        expires_at: token.expires_at,
        severity: 'high'
      });
    });

    // 3. Check for orphaned PKCE data
    const { data: oldPkceData } = await supabase
      .from('ml_pkce_storage')
      .select('tenant_id, created_at')
      .lt('expires_at', new Date().toISOString());

    if (oldPkceData && oldPkceData.length > 0) {
      securityReport.issues.push({
        type: 'orphaned_pkce_data',
        count: oldPkceData.length,
        severity: 'low'
      });

      // Auto-cleanup orphaned PKCE data
      await supabase
        .from('ml_pkce_storage')
        .delete()
        .lt('expires_at', new Date().toISOString());

      securityReport.checks.push({
        type: 'pkce_cleanup',
        action: 'auto_cleaned',
        cleaned_records: oldPkceData.length
      });
    }

    // 4. Generate security recommendations
    securityReport.recommendations = [
      {
        id: 'enable_rate_limiting',
        title: 'Implementar Rate Limiting',
        description: 'Configure limites de taxa para prevenir abuso',
        priority: 'medium'
      },
      {
        id: 'token_rotation',
        title: 'Rotação Automática de Tokens',
        description: 'Implement token rotation schedule',
        priority: 'high'
      },
      {
        id: 'audit_logging',
        title: 'Log de Auditoria Detalhado',
        description: 'Expandir logs para incluir mais contexto de segurança',
        priority: 'low'
      }
    ];

    // 5. Store security report
    await supabase.from('ml_sync_log').insert({
      tenant_id: '00000000-0000-0000-0000-000000000000', // System tenant
      operation_type: 'security_scan',
      entity_type: 'system',
      status: 'success',
      response_data: securityReport
    });

    // 6. Alert on critical issues
    const criticalIssues = securityReport.issues.filter(issue => issue.severity === 'high');
    if (criticalIssues.length > 0) {
      console.warn('CRITICAL SECURITY ISSUES DETECTED:', criticalIssues);
      
      // In a real implementation, you would send alerts via email/Slack/etc
      await supabase.from('ml_sync_log').insert({
        tenant_id: '00000000-0000-0000-0000-000000000000',
        operation_type: 'security_alert',
        entity_type: 'system',
        status: 'warning',
        error_details: {
          critical_issues: criticalIssues,
          alert_time: new Date().toISOString()
        }
      });
    }

    console.log(`Security scan completed: ${securityReport.issues.length} issues found`);

    return new Response(
      JSON.stringify({
        success: true,
        report: securityReport,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Fatal error in security monitoring:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});