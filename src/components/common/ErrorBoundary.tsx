import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeout?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      errorCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Increment error count
    this.setState(prevState => ({
      errorCount: prevState.errorCount + 1
    }));

    // Auto reset after 10 seconds if not too many errors
    if (this.state.errorCount < 3) {
      this.resetTimeout = setTimeout(() => {
        this.handleReset();
      }, 10000);
    }
  }

  componentWillUnmount() {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
  }

  handleReset = () => {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
    
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro na Aplicação</AlertTitle>
              <AlertDescription>
                {this.state.errorCount > 2 
                  ? "Múltiplos erros detectados. A aplicação pode estar em loop infinito."
                  : "Ocorreu um erro inesperado. Tentando recuperar automaticamente..."
                }
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button 
                onClick={this.handleReset} 
                className="w-full"
                disabled={this.state.errorCount > 2}
              >
                Tentar Novamente
              </Button>
              
              {this.state.errorCount > 2 && (
                <Button 
                  onClick={this.handleReload} 
                  variant="outline" 
                  className="w-full"
                >
                  Recarregar Página
                </Button>
              )}
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 bg-gray-100 rounded text-sm">
                <summary className="cursor-pointer font-medium">
                  Detalhes do Erro (Desenvolvimento)
                </summary>
                <pre className="mt-2 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}