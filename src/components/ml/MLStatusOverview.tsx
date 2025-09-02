import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Activity
} from "@/components/ui/icons";
import { useMLIntegration, useMLConnectionStatus } from "@/hooks/useMLIntegration";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export function MLStatusOverview() {
  const { sync, syncStatusQuery } = useMLIntegration();
  const { isConnected, connectionHealth } = useMLConnectionStatus();
  
  if (!isConnected) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h4 className="mb-2 text-lg font-medium">Mercado Livre não conectado</h4>
            <p className="text-muted-foreground">
              Conecte sua conta para ver o status da sincronização
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (syncStatusQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (!sync) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h4 className="mb-2 text-lg font-medium">Erro ao carregar status</h4>
            <Button 
              onClick={() => syncStatusQuery.refetch()}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="mr-2 size-4" />
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getHealthBadge = () => {
    switch (connectionHealth) {
      case 'healthy':
        return <Badge className="bg-success text-success-foreground">🟢 Saudável</Badge>;
      case 'warning':
        return <Badge variant="destructive">⚠️ Atenção</Badge>;
      case 'critical':
        return <Badge variant="destructive">🔴 Crítico</Badge>;
      default:
        return <Badge variant="secondary">🔄 Verificando</Badge>;
    }
  };

  const getStatusIcon = (count: number, total: number) => {
    if (count === 0) return <Package className="size-5 text-muted-foreground" />;
    if (count === total) return <CheckCircle2 className="size-5 text-success" />;
    return <Activity className="size-5 text-warning" />;
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Status de Conexão */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status da Conexão</CardTitle>
          {getHealthBadge()}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">Conectado</div>
          <p className="text-xs text-muted-foreground">
            {sync.successful_24h || 0} operações nas últimas 24h
          </p>
        </CardContent>
      </Card>

      {/* Total de Produtos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
          {getStatusIcon(sync.total_products || 0, sync.total_products || 0)}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{sync.total_products || 0}</div>
          <p className="text-xs text-muted-foreground">
            Produtos no sistema ML
          </p>
        </CardContent>
      </Card>

      {/* Produtos Sincronizados */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sincronizados</CardTitle>
          {getStatusIcon(sync.synced_products || 0, sync.total_products || 0)}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">
            {sync.synced_products || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {sync.total_products ? 
              `${Math.round(((sync.synced_products || 0) / sync.total_products) * 100)}% sincronizados` : 
              'Nenhum produto'
            }
          </p>
        </CardContent>
      </Card>

      {/* Produtos com Erro */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Com Problemas</CardTitle>
          {(sync.error_products || 0) > 0 ? (
            <AlertCircle className="size-5 text-destructive" />
          ) : (
            <CheckCircle2 className="size-5 text-success" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            (sync.error_products || 0) > 0 ? 'text-destructive' : 'text-success'
          }`}>
            {sync.error_products || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {(sync.error_products || 0) > 0 ? 'Precisam de atenção' : 'Tudo funcionando'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}