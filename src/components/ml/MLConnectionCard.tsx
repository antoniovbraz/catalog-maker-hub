import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Unlink } from "@/components/ui/icons";
import { useMLIntegration, useMLAuth, useMLAuthDisconnect } from "@/hooks/useMLIntegration";
import { useState } from "react";

export function MLConnectionCard() {
  const { auth, authQuery } = useMLIntegration();
  const { startAuth } = useMLAuth();
  const disconnectMutation = useMLAuthDisconnect();
  const authStatus = auth;
  const isLoading = authQuery.isLoading;
  const refetch = authQuery.refetch;
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const handleConnect = () => {
    startAuth.mutate();
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
    setShowDisconnectConfirm(false);
  };

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="size-5 animate-spin" />;
    if (authStatus?.isConnected) return <CheckCircle2 className="size-5 text-success" />;
    return <AlertCircle className="size-5 text-warning" />;
  };

  const getStatusBadge = () => {
    if (isLoading) return <Badge variant="secondary">Verificando...</Badge>;
    if (authStatus?.isConnected) return <Badge className="bg-success text-success-foreground">🟢 Conectado</Badge>;
    return <Badge variant="destructive">🔴 Desconectado</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <CardTitle className="text-lg">Mercado Livre</CardTitle>
            <CardDescription>
              Integração com sua conta do Mercado Livre
            </CardDescription>
          </div>
        </div>
        {getStatusBadge()}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {authStatus?.isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Nome da Loja:</span>
              <span className="font-semibold">
                {authStatus.ml_nickname || 
                 (authStatus.user_id_ml ? `Loja #${authStatus.user_id_ml}` : 'Carregando...')}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status do Sistema:</span>
                <span className="font-medium text-success">
                🔄 Renovação Automática Ativa
              </span>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => refetch()}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <RefreshCw className="mr-2 size-4" />
                Verificar Status
              </Button>
              
              {!showDisconnectConfirm ? (
                <Button 
                  onClick={() => setShowDisconnectConfirm(true)}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <Unlink className="mr-2 size-4" />
                  Desconectar
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button 
                    onClick={handleDisconnect}
                    disabled={disconnectMutation.isPending}
                    variant="destructive"
                    size="sm"
                  >
                    {disconnectMutation.isPending ? (
                      <Loader2 className="mr-1 size-3 animate-spin" />
                    ) : null}
                    Confirmar
                  </Button>
                  <Button 
                    onClick={() => setShowDisconnectConfirm(false)}
                    variant="ghost"
                    size="sm"
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Conecte sua conta do Mercado Livre para sincronizar produtos e gerenciar vendas automaticamente.
            </p>
            
            {(authStatus?.error || startAuth.error) && (
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="text-sm text-destructive">
                  {authStatus?.error || (startAuth.error as Error)?.message}
                </p>
              </div>
            )}
            
            <Button 
              onClick={handleConnect}
              disabled={startAuth.isPending}
              className="w-full"
            >
              {startAuth.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 size-4" />
              )}
              Conectar com Mercado Livre
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}