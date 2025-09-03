#!/usr/bin/env node

/**
 * Script para configurar observabilidade estruturada
 * Parte do PR-C da auditoria técnica
 */

const fs = require('fs');
const path = require('path');

console.log('📊 Configurando observabilidade estruturada...');

// 1. Criar logger estruturado
const loggerContent = `import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  scope?: string;
  tenantId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

export class Logger {
  private correlationId: string;
  private scope: string;

  constructor(scope: string = 'app', correlationId?: string) {
    this.scope = scope;
    this.correlationId = correlationId || this.generateCorrelationId();
  }

  private generateCorrelationId(): string {
    return \`\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
  }

  private log(entry: Omit<LogEntry, 'timestamp' | 'scope' | 'correlationId'>): void {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", { locale: ptBR }),
      scope: this.scope,
      correlationId: this.correlationId,
    };

    // Em produção, enviar para serviço de logging
    if (import.meta.env.PROD) {
      // TODO: Integrar com serviço de logging (ex: Sentry, LogRocket)
      console.log(JSON.stringify(logEntry));
    } else {
      // Em desenvolvimento, log colorido
      const colors = {
        debug: '\\x1b[36m', // cyan
        info: '\\x1b[32m',  // green
        warn: '\\x1b[33m',  // yellow
        error: '\\x1b[31m', // red
        reset: '\\x1b[0m'
      };
      
      console.log(
        \`\${colors[entry.level]}[\${entry.level.toUpperCase()}] \${this.scope}\${colors.reset}: \${entry.message}\`,
        entry.metadata ? entry.metadata : ''
      );
    }
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log({ level: 'debug', message, metadata });
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log({ level: 'info', message, metadata });
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log({ level: 'warn', message, metadata });
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.log({ 
      level: 'error', 
      message, 
      metadata: {
        ...metadata,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined
      }
    });
  }

  child(scope: string): Logger {
    return new Logger(\`\${this.scope}:\${scope}\`, this.correlationId);
  }
}

// Factory function
export function createLogger(scope: string): Logger {
  return new Logger(scope);
}

// Default logger instance
export const logger = createLogger('catalog-maker-hub');

// Performance monitoring
export function measurePerformance<T>(
  operation: string,
  fn: () => T | Promise<T>,
  logger?: Logger
): T | Promise<T> {
  const log = logger || createLogger('performance');
  const start = performance.now();
  
  const measure = (result: T) => {
    const duration = performance.now() - start;
    log.info(\`Operation completed: \${operation}\`, {
      duration: \`\${duration.toFixed(2)}ms\`,
      operation
    });
    return result;
  };

  try {
    const result = fn();
    
    if (result instanceof Promise) {
      return result
        .then(measure)
        .catch((error) => {
          const duration = performance.now() - start;
          log.error(\`Operation failed: \${operation}\`, error, {
            duration: \`\${duration.toFixed(2)}ms\`,
            operation
          });
          throw error;
        });
    } else {
      return measure(result);
    }
  } catch (error) {
    const duration = performance.now() - start;
    log.error(\`Operation failed: \${operation}\`, error as Error, {
      duration: \`\${duration.toFixed(2)}ms\`,
      operation
    });
    throw error;
  }
}

// Business metrics tracking
export interface BusinessMetric {
  name: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
  timestamp?: string;
}

export function trackMetric(metric: BusinessMetric): void {
  const fullMetric: Required<BusinessMetric> = {
    ...metric,
    timestamp: new Date().toISOString()
  };

  // Log metric
  logger.info(\`Metric tracked: \${metric.name}\`, {
    metric: fullMetric,
    type: 'business_metric'
  });

  // Em produção, enviar para serviço de métricas
  if (import.meta.env.PROD) {
    // TODO: Integrar com serviço de métricas (ex: DataDog, New Relic)
  }
}

// Error boundary logger
export function logError(error: Error, componentName?: string, metadata?: Record<string, unknown>): void {
  const errorLogger = createLogger('error-boundary');
  errorLogger.error(\`React Error Boundary triggered\`, error, {
    component: componentName,
    ...metadata
  });
}
`;

// 2. Criar métricas de negócio
const metricsContent = `import { trackMetric } from '@/utils/logger';

// Métricas específicas do negócio
export const BusinessMetrics = {
  // Sincronização ML
  mlSyncSuccess: (productId: string, duration: number) => {
    trackMetric({
      name: 'ml_sync_success',
      value: duration,
      unit: 'ms',
      tags: { productId, status: 'success' }
    });
  },

  mlSyncError: (productId: string, errorType: string) => {
    trackMetric({
      name: 'ml_sync_error',
      value: 1,
      unit: 'count',
      tags: { productId, errorType }
    });
  },

  // Cálculo de preços
  pricingCalculation: (duration: number, marketplace: string) => {
    trackMetric({
      name: 'pricing_calculation',
      value: duration,
      unit: 'ms',
      tags: { marketplace }
    });
  },

  // Atividade do usuário
  userAction: (action: string, userId: string, tenantId: string) => {
    trackMetric({
      name: 'user_action',
      value: 1,
      unit: 'count',
      tags: { action, userId, tenantId }
    });
  },

  // Performance de queries
  queryPerformance: (queryType: string, duration: number, success: boolean) => {
    trackMetric({
      name: 'query_performance',
      value: duration,
      unit: 'ms',
      tags: { queryType, success: success.toString() }
    });
  }
};
`;

// 3. Criar Error Boundary aprimorado
const errorBoundaryContent = `import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from '@/components/ui/icons';
import { logError } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: \`err-\${Date.now()}-\${Math.random().toString(36).substr(2, 5)}\`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log do erro
    logError(error, this.constructor.name, {
      errorId: this.state.errorId,
      level: this.props.level,
      componentStack: errorInfo.componentStack,
      retryCount: this.retryCount
    });

    // Callback customizado
    this.props.onError?.(error, errorInfo);
    
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback baseado no nível
      const isCritical = this.props.level === 'critical';
      const isPage = this.props.level === 'page';

      return (
        <Card className={\`mx-auto max-w-lg \${isCritical ? 'border-destructive' : ''}\`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              {isCritical ? 'Erro Crítico' : 'Ops! Algo deu errado'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {isCritical ? (
                <p>
                  Um erro crítico ocorreu no sistema. Nossa equipe foi notificada
                  automaticamente.
                </p>
              ) : (
                <p>
                  Encontramos um problema inesperado. Tente recarregar a página
                  ou volte ao início.
                </p>
              )}
            </div>

            {/* Detalhes técnicos em desenvolvimento */}
            {!import.meta.env.PROD && (
              <details className="rounded border p-2 text-xs">
                <summary className="cursor-pointer font-medium">
                  Detalhes técnicos (dev only)
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <strong>Error ID:</strong> {this.state.errorId}
                  </div>
                  <div>
                    <strong>Message:</strong> {this.state.error?.message}
                  </div>
                  {this.state.error?.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              {!isCritical && this.retryCount < this.maxRetries && (
                <Button onClick={this.handleRetry} className="flex-1">
                  <RefreshCw className="mr-2 size-4" />
                  Tentar Novamente ({this.maxRetries - this.retryCount} restantes)
                </Button>
              )}
              
              {(isPage || isCritical) && (
                <Button 
                  variant="outline" 
                  onClick={this.handleGoHome}
                  className="flex-1"
                >
                  <Home className="mr-2 size-4" />
                  Voltar ao Início
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook para capturar erros assíncronos
export function useErrorHandler() {
  return (error: Error, context?: string) => {
    logError(error, context, { type: 'async_error' });
    
    // Em produção, poderia mostrar toast de erro
    if (import.meta.env.PROD) {
      // toast.error('Algo deu errado. Tente novamente.');
    }
  };
}
`;

// Escrever arquivos
fs.writeFileSync(path.join('src', 'utils', 'logger.ts'), loggerContent);
fs.writeFileSync(path.join('src', 'utils', 'metrics.ts'), metricsContent);
fs.writeFileSync(path.join('src', 'components', 'common', 'ErrorBoundary.tsx'), errorBoundaryContent);

console.log('✅ Observabilidade estruturada configurada!');
console.log('📋 Arquivos criados:');
console.log('   - src/utils/logger.ts');
console.log('   - src/utils/metrics.ts');
console.log('   - src/components/common/ErrorBoundary.tsx');
console.log('📊 Próximos passos:');
console.log('   1. Integrar logger nos services');
console.log('   2. Adicionar Error Boundaries nas páginas');
console.log('   3. Configurar métricas de negócio');
console.log('   4. Integrar com serviços externos (produção)');