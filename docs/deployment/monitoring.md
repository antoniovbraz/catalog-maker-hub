# Monitoramento e Observabilidade

Sistema completo de monitoramento para a integração Mercado Livre.

## Visão Geral

O monitoramento cobre 4 camadas principais:
- **Infraestrutura**: Supabase, Edge Functions, Database
- **Aplicação**: Frontend React, APIs, Webhooks
- **Negócio**: Sincronização, Vendas, Performance
- **Experiência**: Usuário final, Tempos de resposta

## Infraestrutura - Supabase

### 1. Database Monitoring

```sql
-- Monitorar conexões ativas
SELECT count(*) as active_connections
FROM pg_stat_activity 
WHERE state = 'active';

-- Queries lentas (>1s)
SELECT 
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements 
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC;

-- Tamanho das tabelas ML
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE tablename LIKE 'ml_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 2. Edge Functions Monitoring

```typescript
// Monitoramento de performance das Edge Functions
const functionMetrics = {
  'ml-auth': {
    averageResponseTime: '<2s',
    errorRate: '<1%',
    invocations: 'per hour'
  },
  'ml-sync': {
    averageResponseTime: '<5s',
    errorRate: '<2%',
    invocations: 'per sync operation'
  },
  'ml-webhook': {
    averageResponseTime: '<1s',
    errorRate: '<0.5%',
    invocations: 'per webhook'
  }
}
```

### 3. Alertas Críticos

```typescript
// Configuração de alertas via Supabase Dashboard
const criticalAlerts = {
  database: {
    connections: {
      threshold: '> 80',
      action: 'Scale up connections',
      notify: ['tech-lead@company.com']
    },
    queryTime: {
      threshold: '> 5s average',
      action: 'Review slow queries',
      notify: ['dba@company.com']
    }
  },
  functions: {
    errorRate: {
      threshold: '> 5% in 5min',
      action: 'Check function logs',
      notify: ['dev-team@company.com']
    },
    memoryUsage: {
      threshold: '> 90%',
      action: 'Scale function memory',
      notify: ['devops@company.com']
    }
  }
}
```

## Aplicação - Logs Estruturados

### 1. Logging Strategy

```typescript
// src/utils/logger.ts - Logs estruturados
export const logger = {
  ml: {
    oauth: (action: string, data: any) => 
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        service: 'ml-oauth',
        action,
        data,
        tenantId: data.tenantId
      })),
    
    sync: (operation: string, productId: string, result: any) =>
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        service: 'ml-sync',
        operation,
        productId,
        result,
        duration: result.duration
      })),
    
    webhook: (topic: string, resource: string, status: string) =>
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        service: 'ml-webhook',
        topic,
        resource,
        status
      }))
  }
}
```

### 2. Error Tracking

```typescript
// Rastreamento de erros estruturado
export const trackError = (error: Error, context: any) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    message: error.message,
    stack: error.stack,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href
  }
  
  // Log para Supabase
  supabase.from('error_logs').insert(errorLog)
  
  // Console para debug local
  console.error('Error tracked:', errorLog)
}
```

### 3. Performance Monitoring

```typescript
// Performance tracking para operações críticas
export const trackPerformance = (operation: string) => {
  const start = performance.now()
  
  return {
    end: () => {
      const duration = performance.now() - start
      
      const perfLog = {
        timestamp: new Date().toISOString(),
        operation,
        duration: Math.round(duration),
        url: window.location.pathname
      }
      
      // Log apenas operações lentas (>1s)
      if (duration > 1000) {
        console.warn('Slow operation:', perfLog)
        supabase.from('performance_logs').insert(perfLog)
      }
    }
  }
}

// Uso:
const perf = trackPerformance('ml-product-sync')
await syncProductToML(productId)
perf.end()
```

## Negócio - Métricas de Integração

### 1. Dashboard de Status

```typescript
// src/components/monitoring/MLStatusDashboard.tsx
export const MLStatusDashboard = () => {
  const [status, setStatus] = useState<MLIntegrationStatus>()
  
  useEffect(() => {
    const fetchStatus = async () => {
      const { data } = await supabase
        .from('ml_integration_status')
        .select('*')
        .single()
      
      setStatus(data)
    }
    
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000) // 30s
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard
        title="Produtos Sincronizados"
        value={status?.synced_products}
        total={status?.total_products}
        color="green"
      />
      <MetricCard
        title="Pedidos Este Mês"
        value={status?.orders_this_month}
        subtitle={`R$ ${status?.revenue_this_month}`}
        color="blue"
      />
      <MetricCard
        title="Status Conexão"
        value={status?.connection_status}
        color={status?.connection_status === 'connected' ? 'green' : 'red'}
      />
      <MetricCard
        title="Última Sincronização"
        value={formatTimeAgo(status?.last_product_sync)}
        color="gray"
      />
    </div>
  )
}
```

### 2. Métricas em Tempo Real

```sql
-- View de métricas em tempo real
CREATE OR REPLACE VIEW ml_real_time_metrics AS
SELECT 
  -- Conexão
  CASE 
    WHEN COUNT(DISTINCT a.id) > 0 AND MAX(a.expires_at) > now() THEN 'connected'
    WHEN COUNT(DISTINCT a.id) > 0 THEN 'token_expired'
    ELSE 'not_connected'
  END as connection_status,
  
  -- Sincronização últimas 24h
  COUNT(DISTINCT CASE 
    WHEN l.created_at >= now() - INTERVAL '24 hours' 
    AND l.status = 'success' 
    THEN l.id 
  END) as syncs_last_24h,
  
  -- Erros últimas 24h
  COUNT(DISTINCT CASE 
    WHEN l.created_at >= now() - INTERVAL '24 hours' 
    AND l.status = 'error' 
    THEN l.id 
  END) as errors_last_24h,
  
  -- Webhooks processados última hora
  COUNT(DISTINCT CASE 
    WHEN w.created_at >= now() - INTERVAL '1 hour' 
    AND w.processed_at IS NOT NULL 
    THEN w.id 
  END) as webhooks_last_hour,
  
  -- Performance média Edge Functions
  AVG(l.execution_time_ms) as avg_execution_time
  
FROM profiles p
LEFT JOIN ml_auth_tokens a ON a.tenant_id = p.tenant_id
LEFT JOIN ml_sync_log l ON l.tenant_id = p.tenant_id
LEFT JOIN ml_webhook_events w ON w.tenant_id = p.tenant_id
GROUP BY p.tenant_id;
```

### 3. Alertas de Negócio

```typescript
// Sistema de alertas baseado em regras de negócio
const businessAlerts = {
  syncFailure: {
    condition: 'error_rate > 10% in last hour',
    action: 'Check ML API status and token validity',
    priority: 'HIGH'
  },
  
  webhookDelay: {
    condition: 'webhook_processing_delay > 5 minutes',
    action: 'Verify webhook URL and processing function',
    priority: 'MEDIUM'
  },
  
  orderImportFail: {
    condition: 'no orders imported in 2 hours during business hours',
    action: 'Check ML orders API and webhook subscription',
    priority: 'HIGH'
  },
  
  tokenExpiry: {
    condition: 'access_token expires in < 1 hour',
    action: 'Automatic refresh or notify user',
    priority: 'MEDIUM'
  }
}
```

## Experiência do Usuário

### 1. Frontend Monitoring

```typescript
// Real User Monitoring (RUM)
export const rumCollector = {
  pageLoad: () => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    return {
      domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
      loadComplete: Math.round(perfData.loadEventEnd - perfData.fetchStart),
      firstContentfulPaint: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0)
    }
  },
  
  userInteraction: (action: string, element: string) => {
    const timestamp = Date.now()
    
    return {
      track: (outcome: 'success' | 'error', duration?: number) => {
        const interactionLog = {
          timestamp: new Date(timestamp).toISOString(),
          action,
          element,
          outcome,
          duration: duration || Date.now() - timestamp,
          page: window.location.pathname
        }
        
        // Analytics endpoint
        fetch('/api/analytics/interaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(interactionLog)
        })
      }
    }
  }
}

// Uso:
const interaction = rumCollector.userInteraction('ml-sync', 'sync-button')
try {
  await syncProduct(productId)
  interaction.track('success')
} catch (error) {
  interaction.track('error')
}
```

### 2. Error Boundaries

```typescript
// src/components/ErrorBoundary.tsx
class MLErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error, errorInfo) {
    // Log erro estruturado
    const errorLog = {
      timestamp: new Date().toISOString(),
      type: 'react-error-boundary',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: window.location.href
    }
    
    // Enviar para logging
    supabase.from('frontend_errors').insert(errorLog)
    
    console.error('React Error Boundary:', errorLog)
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      )
    }
    
    return this.props.children
  }
}
```

## Health Checks

### 1. System Health Endpoint

```typescript
// supabase/functions/health-check/index.ts
export default async function healthCheck(req: Request) {
  const checks = await Promise.allSettled([
    // Database connectivity
    supabase.from('profiles').select('count').limit(1),
    
    // ML API connectivity  
    fetch('https://api.mercadolibre.com/sites/MLB'),
    
    // Webhook endpoint test
    testWebhookConnectivity(),
    
    // Token validity
    checkTokenValidity(),
  ])
  
  const healthStatus = {
    timestamp: new Date().toISOString(),
    status: checks.every(c => c.status === 'fulfilled') ? 'healthy' : 'degraded',
    checks: {
      database: checks[0].status === 'fulfilled' ? 'ok' : 'error',
      mlApi: checks[1].status === 'fulfilled' ? 'ok' : 'error', 
      webhooks: checks[2].status === 'fulfilled' ? 'ok' : 'error',
      tokens: checks[3].status === 'fulfilled' ? 'ok' : 'error'
    },
    details: checks.map(c => c.status === 'rejected' ? c.reason : 'ok')
  }
  
  return new Response(JSON.stringify(healthStatus), {
    status: healthStatus.status === 'healthy' ? 200 : 503,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

### 2. Automated Health Monitoring

```typescript
// Health check automation (via cron job ou service externo)
const healthMonitor = {
  async checkAndAlert() {
    const response = await fetch('https://ngkhzbzynkhgezkqykeb.supabase.co/functions/v1/health-check')
    const health = await response.json()
    
    if (health.status !== 'healthy') {
      await this.sendAlert({
        level: 'WARNING',
        message: `System health degraded: ${JSON.stringify(health.checks)}`,
        timestamp: health.timestamp
      })
    }
    
    // Log health status
    await supabase.from('health_log').insert({
      status: health.status,
      checks: health.checks,
      timestamp: health.timestamp
    })
  },
  
  async sendAlert(alert) {
    // Slack webhook, email, etc.
    console.log('ALERT:', alert)
  }
}

// Executar a cada 5 minutos
setInterval(() => healthMonitor.checkAndAlert(), 5 * 60 * 1000)
```

## Dashboards e Visualização

### 1. Executive Dashboard

```typescript
// Métricas executivas para stakeholders
const executiveDashboard = {
  kpis: {
    integration_health: '99.5% uptime',
    products_synced: '1,234 of 1,250',
    monthly_revenue: 'R$ 45,678',
    sync_performance: '< 2s average'
  },
  
  trends: {
    daily_syncs: [120, 135, 98, 156, 178, 145, 167],
    error_rate: [0.5, 0.3, 0.8, 0.2, 0.1, 0.4, 0.3],
    response_time: [1.2, 1.5, 1.8, 1.1, 0.9, 1.3, 1.0]
  }
}
```

### 2. Technical Dashboard

```typescript
// Dashboard técnico para desenvolvedores
const technicalDashboard = {
  infrastructure: {
    database_connections: 45,
    function_invocations: 1254,
    webhook_queue_size: 3,
    error_count_24h: 12
  },
  
  performance: {
    p50_response_time: '1.2s',
    p95_response_time: '3.8s',
    p99_response_time: '8.1s',
    cache_hit_rate: '87%'
  }
}
```

## Runbooks de Incidentes

### 1. Incident Response

```markdown
## Incident: ML Integration Down

### Symptoms
- Users cannot connect to Mercado Livre
- Sync operations failing
- Webhooks not processing

### Immediate Actions (< 5 min)
1. Check health endpoint status
2. Verify Supabase function logs
3. Test ML API connectivity
4. Check token expiry status

### Investigation (< 15 min)  
1. Review error logs from last 1 hour
2. Check for ML API rate limiting
3. Verify webhook URL accessibility
4. Test OAuth flow manually

### Resolution (< 30 min)
1. Refresh expired tokens if needed
2. Restart failing Edge Functions
3. Update webhook URLs if changed
4. Escalate to ML support if API issue

### Post-Incident
1. Document root cause
2. Update monitoring alerts
3. Improve prevention measures
4. Communicate resolution to users
```

## Métricas e SLAs

### Service Level Objectives (SLOs)

```typescript
const slos = {
  availability: {
    target: '99.9%',
    measurement: 'uptime of core ML integration features'
  },
  
  performance: {
    target: '95% of requests < 2s',
    measurement: 'Edge Function response times'
  },
  
  reliability: {
    target: '< 1% error rate',
    measurement: 'successful vs failed operations'
  },
  
  consistency: {
    target: '99% data accuracy',
    measurement: 'sync operations without data corruption'
  }
}
```

### Key Performance Indicators (KPIs)

```typescript
const kpis = {
  business: {
    sync_success_rate: '> 99%',
    webhook_processing_time: '< 30s',
    user_satisfaction: '> 4.5/5',
    integration_adoption: '> 80%'
  },
  
  technical: {
    mean_time_to_recovery: '< 15 min',
    mean_time_between_failures: '> 7 days',
    deployment_frequency: '> 1/week',
    change_failure_rate: '< 5%'
  }
}
```

Documentação completa criada! Todas as áreas críticas estão cobertas com monitoramento robusto.