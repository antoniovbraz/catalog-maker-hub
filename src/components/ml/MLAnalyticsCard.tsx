import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Download, Shield, Clock, Users, Database } from "@/components/ui/icons";
import { useMLPerformanceMetrics, useMLBackup } from "@/hooks/useMLAdvanced";
import { useMLIntegration } from "@/hooks/useMLIntegration";

export function MLAnalyticsCard() {
  const { auth, authQuery } = useMLIntegration();
  const authStatus = auth;
  const authLoading = authQuery.isLoading;
  const { data: metrics, isLoading: metricsLoading } = useMLPerformanceMetrics(7);
  const backupMutation = useMLBackup();

  if (!authStatus?.isConnected || authLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart className="size-5" />
            <span>Analytics & Performance</span>
          </CardTitle>
          <CardDescription>Métricas detalhadas da integração</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            {!authStatus?.isConnected ? "Conecte-se ao ML para ver analytics" : "Carregando métricas..."}
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleBackup = () => {
    backupMutation.mutate();
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center space-x-2">
          <BarChart className="size-5 text-primary" />
          <div>
            <CardTitle className="text-lg">Analytics & Performance</CardTitle>
            <CardDescription>Últimos 7 dias de operações</CardDescription>
          </div>
        </div>
        <Button
          onClick={handleBackup}
          disabled={backupMutation.isPending}
          variant="outline"
          size="sm"
        >
          <Download className="mr-2 size-4" />
          Backup
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Success Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center space-x-2">
              <Shield className="size-4 text-success" />
              <span>Taxa de Sucesso</span>
            </span>
            <Badge className="bg-success text-success-foreground">
              {metrics?.success_rate || 0}%
            </Badge>
          </div>
          <Progress value={metrics?.success_rate || 0} className="h-2" />
        </div>

        {/* Response Time */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center space-x-2">
              <Clock className="size-4 text-warning" />
              <span>Tempo Médio de Resposta</span>
            </span>
            <span className="font-semibold">
              {metrics?.average_response_time ? 
                `${Math.round(metrics.average_response_time)}ms` : 'N/A'
              }
            </span>
          </div>
        </div>

        {/* Operations Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-md bg-success/10 p-3">
            <div className="flex items-center space-x-2">
              <Users className="size-4 text-success" />
              <span className="text-sm text-muted-foreground">Sucessos</span>
            </div>
            <p className="text-lg font-bold text-success">
              {metrics?.successful_operations || 0}
            </p>
          </div>
          
          <div className="rounded-md bg-destructive/10 p-3">
            <div className="flex items-center space-x-2">
              <Database className="size-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Falhas</span>
            </div>
            <p className="text-lg font-bold text-destructive">
              {metrics?.failed_operations || 0}
            </p>
          </div>
        </div>

        {/* Operations by Type */}
        {metrics?.operations_by_type && Object.keys(metrics.operations_by_type).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Operações por Tipo</h4>
            <div className="space-y-1">
              {Object.entries(metrics.operations_by_type).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-xs">
                  <span className="capitalize">{type.replace('_', ' ')}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total Operations */}
        <div className="border-t pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total de Operações</span>
            <span className="font-semibold">{metrics?.total_operations || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}