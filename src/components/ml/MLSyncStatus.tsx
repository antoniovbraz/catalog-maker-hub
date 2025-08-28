import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Package, CheckCircle2, AlertTriangle, Clock } from "@/components/ui/icons";
import { useMLSyncStatus } from "@/hooks/useMLSync";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function MLSyncStatus() {
  const { data: syncStatus, isLoading } = useMLSyncStatus();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (!syncStatus) {
    return null;
  }

  const syncProgress = syncStatus.total_products > 0 ? 
    (syncStatus.synced_products / syncStatus.total_products) * 100 : 0;

  const stats = [
    {
      label: "Total de Produtos",
      value: syncStatus.total_products,
      icon: Package,
      color: "text-foreground"
    },
    {
      label: "Sincronizados",
      value: syncStatus.synced_products,
      icon: CheckCircle2,
      color: "text-success"
    },
    {
      label: "Pendentes",
      value: syncStatus.pending_products,
      icon: Clock,
      color: "text-warning"
    },
    {
      label: "Com Erro",
      value: syncStatus.error_products,
      icon: AlertTriangle,
      color: "text-destructive"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <BarChart3 className="size-5" />
          <CardTitle>Status de Sincronização</CardTitle>
        </div>
        <CardDescription>
          Acompanhe o progresso da sincronização dos seus produtos
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso da Sincronização</span>
            <span className="font-medium">{Math.round(syncProgress)}%</span>
          </div>
          <Progress value={syncProgress} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center space-x-3 rounded-lg border p-3">
              <div className={`rounded-full p-2 ${stat.color.replace('text-', 'bg-')}/10`}>
                <stat.icon className={`size-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Last Sync */}
        {syncStatus.last_sync_at && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Última sincronização:</span>
            <Badge variant="outline">
              {formatDistanceToNow(new Date(syncStatus.last_sync_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}