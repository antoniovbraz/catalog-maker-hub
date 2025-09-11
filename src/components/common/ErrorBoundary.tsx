import React, { ReactNode } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { AlertTriangle } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

function ErrorFallback({ 
  error, 
  resetErrorBoundary 
}: { 
  error: Error; 
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="size-4" />
          <AlertTitle>Erro na Aplicação</AlertTitle>
          <AlertDescription>
            Ocorreu um erro inesperado. Por favor, tente novamente.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Button 
            onClick={resetErrorBoundary} 
            className="w-full"
          >
            Tentar Novamente
          </Button>
          
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="w-full"
          >
            Recarregar Página
          </Button>
        </div>

        {import.meta.env.DEV && (
          <details className="mt-4 rounded bg-gray-100 p-4 text-sm">
            <summary className="cursor-pointer font-medium">
              Detalhes do Erro (Desenvolvimento)
            </summary>
            <pre className="mt-2 overflow-auto">
              {error.toString()}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export function ErrorBoundary({ children, fallback }: Props) {
  if (fallback) {
    return (
      <ReactErrorBoundary
        FallbackComponent={() => <>{fallback}</>}
        onError={(error, errorInfo) => {
          logger.error('ErrorBoundary', 'Application error caught', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack
          });
        }}
      >
        {children}
      </ReactErrorBoundary>
    );
  }

  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        logger.error('ErrorBoundary', 'Application error caught', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack
        });
      }}
      onReset={() => {
        logger.info('ErrorBoundary', 'Application reset triggered');
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}