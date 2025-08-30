import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, Activity, TrendingUp, Clock } from "@/components/ui/icons";
import { useMLIntegration } from "@/hooks/useMLIntegration";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function MLHealthStatus() {
  const { auth, authQuery } = useMLIntegration();
  const authStatus = auth;
  const isLoading = authQuery.isLoading;

  if (isLoading || !authStatus?.isConnected) {
    return null;
  }

  const getHealthScore = () => {
    if (!authStatus.isConnected) return 0;
    
    const expiresAt = new Date(authStatus.expires_at || '');
    const now = new Date();
    const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Score baseado no tempo até expiração
    if (hoursUntilExpiry > 24) return 100;
    if (hoursUntilExpiry > 6) return 80;
    if (hoursUntilExpiry > 2) return 60;
    if (hoursUntilExpiry > 0) return 40;
    return 20;
  };

  const healthScore = getHealthScore();
  
  const getHealthBadge = () => {
    if (healthScore >= 80) return <Badge className="bg-success text-success-foreground">Excelente</Badge>;
    if (healthScore >= 60) return <Badge className="bg-warning text-warning-foreground">Bom</Badge>;
    if (healthScore >= 40) return <Badge variant="secondary">Regular</Badge>;
    return <Badge variant="destructive">Atenção</Badge>;
  };

  const getHealthIcon = () => {
    if (healthScore >= 80) return <Activity className="size-5 text-success" />;
    if (healthScore >= 60) return <TrendingUp className="size-5 text-warning" />;
    if (healthScore >= 40) return <Clock className="size-5 text-muted-foreground" />;
    return <Wifi className="size-5 text-destructive" />;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center space-x-3">
          {getHealthIcon()}
          <div>
            <CardTitle className="text-lg">Status da Integração</CardTitle>
            <CardDescription>
              Monitoramento em tempo real
            </CardDescription>
          </div>
        </div>
        {getHealthBadge()}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Saúde da Conexão:</span>
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  healthScore >= 80 ? 'bg-success' :
                  healthScore >= 60 ? 'bg-warning' :
                  healthScore >= 40 ? 'bg-secondary' : 'bg-destructive'
                }`}
                style={{ width: `${healthScore}%` }}
              />
            </div>
            <span className="font-semibold">{healthScore}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Renovação Automática:</span>
          <Badge className="bg-primary text-primary-foreground">Ativo</Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Próxima Renovação:</span>
          <span className="text-foreground">
            {authStatus.expires_at ? 
              formatDistanceToNow(new Date(authStatus.expires_at), { 
                addSuffix: true, 
                locale: ptBR 
              }) : 'N/A'
            }
          </span>
        </div>

        {healthScore < 60 && (
          <div className="p-3 bg-warning/10 rounded-md">
            <p className="text-sm text-warning">
              {healthScore < 40 
                ? "⚠️ Token será renovado automaticamente em breve"
                : "ℹ️ Sistema de renovação automática monitorando"
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}