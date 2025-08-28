import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, RefreshCw, AlertCircle, CheckCircle2 } from "@/components/ui/icons";
import { useMLAuth, useMLAuthStart, useMLAuthRefresh } from "@/hooks/useMLAuth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function MLConnectionCard() {
  const { data: authStatus, isLoading, refetch } = useMLAuth();
  const startAuthMutation = useMLAuthStart();
  const refreshMutation = useMLAuthRefresh();

  const handleConnect = () => {
    startAuthMutation.mutate();
  };

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="size-5 animate-spin" />;
    if (authStatus?.connected) return <CheckCircle2 className="size-5 text-success" />;
    return <AlertCircle className="size-5 text-warning" />;
  };

  const getStatusBadge = () => {
    if (isLoading) return <Badge variant="secondary">Verificando...</Badge>;
    if (authStatus?.connected) return <Badge className="bg-success text-success-foreground">Conectado</Badge>;
    return <Badge variant="destructive">Desconectado</Badge>;
  };

  const isTokenExpired = authStatus?.expires_at ? 
    new Date(authStatus.expires_at) < new Date() : false;

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
        {authStatus?.connected ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">ID do Usuário ML:</span>
              <span className="font-mono">{authStatus.user_id_ml}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Token expira em:</span>
              <span className={isTokenExpired ? "text-destructive" : "text-foreground"}>
                {authStatus.expires_at ? 
                  formatDistanceToNow(new Date(authStatus.expires_at), { 
                    addSuffix: true, 
                    locale: ptBR 
                  }) : 'N/A'
                }
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              {isTokenExpired && (
                <Button 
                  onClick={handleRefresh}
                  disabled={refreshMutation.isPending}
                  variant="outline"
                  size="sm"
                >
                  {refreshMutation.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 size-4" />
                  )}
                  Renovar Token
                </Button>
              )}
              
              <Button 
                onClick={() => refetch()}
                variant="ghost"
                size="sm"
              >
                <RefreshCw className="mr-2 size-4" />
                Verificar Status
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Conecte sua conta do Mercado Livre para sincronizar produtos e gerenciar vendas automaticamente.
            </p>
            
            {authStatus?.error && (
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{authStatus.error}</p>
              </div>
            )}
            
            <Button 
              onClick={handleConnect}
              disabled={startAuthMutation.isPending}
              className="w-full"
            >
              {startAuthMutation.isPending ? (
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