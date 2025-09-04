import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from '@/components/ui/icons';
import { logger } from '@/utils/logger';

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
      errorId: `err-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log do erro
    logger.error('React Error Boundary triggered', error, {
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
        <Card className={`mx-auto max-w-lg ${isCritical ? 'border-destructive' : ''}`}>
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
    logger.error('Async error captured', error, { type: 'async_error', context });
    
    // Em produção, poderia mostrar toast de erro
    if (import.meta.env.PROD) {
      // toast.error('Algo deu errado. Tente novamente.');
    }
  };
}