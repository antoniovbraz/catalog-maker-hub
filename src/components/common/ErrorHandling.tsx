import { AlertCircle, RefreshCw } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorDisplayProps {
  title: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorDisplay({ 
  title, 
  message, 
  onRetry, 
  retryLabel = "Tentar novamente" 
}: ErrorDisplayProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 size-12 text-destructive" />
          <h4 className="mb-2 text-lg font-medium">{title}</h4>
          {message && (
            <p className="mb-4 text-muted-foreground">{message}</p>
          )}
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="mr-2 size-4" />
              {retryLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface NetworkErrorProps {
  onRetry?: () => void;
}

export function NetworkError({ onRetry }: NetworkErrorProps) {
  return (
    <ErrorDisplay
      title="Erro de Conexão"
      message="Não foi possível conectar com o servidor. Verifique sua conexão com a internet."
      onRetry={onRetry}
    />
  );
}

interface UnauthorizedErrorProps {
  onReconnect?: () => void;
}

export function UnauthorizedError({ onReconnect }: UnauthorizedErrorProps) {
  return (
    <ErrorDisplay
      title="Sessão Expirada"
      message="Sua sessão do Mercado Livre expirou. Reconecte sua conta para continuar."
      onRetry={onReconnect}
      retryLabel="Reconectar"
    />
  );
}