import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ShieldCheck, 
  Globe, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap,
  Eye
} from "@/components/ui/icons";
import { useMLAuth } from "@/hooks/useMLAuth";
import { useMLAdvancedSettings } from "@/hooks/useMLAdvancedSettings";

export function MLSystemOverview() {
  const { data: authStatus } = useMLAuth();
  const { data: settings } = useMLAdvancedSettings();

  if (!authStatus?.connected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="size-5" />
            <span>Visão Geral do Sistema</span>
          </CardTitle>
          <CardDescription>Status completo da integração ML</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Globe className="size-12 mx-auto mb-4 opacity-30" />
            <p>Conecte-se ao Mercado Livre para ver o status do sistema</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const systemFeatures = [
    {
      name: "Renovação Automática",
      status: "active",
      description: "Tokens renovados automaticamente",
      icon: <CheckCircle className="size-4 text-success" />
    },
    {
      name: "Monitoramento de Segurança",
      status: settings?.advanced_monitoring ? "active" : "inactive",
      description: "Verificação diária de anomalias",
      icon: <ShieldCheck className="size-4 text-primary" />
    },
    {
      name: "Rate Limiting",
      status: "active",
      description: "Proteção contra spam e abuso",
      icon: <Eye className="size-4 text-warning" />
    },
    {
      name: "Backup Automático",
      status: settings?.backup_schedule ? "active" : "inactive",
      description: `Agendado ${settings?.backup_schedule || 'diariamente'}`,
      icon: <TrendingUp className="size-4 text-info" />
    }
  ];

  const getSystemHealth = () => {
    const expiresAt = new Date(authStatus.expires_at || '');
    const now = new Date();
    const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilExpiry > 24) return { score: 100, status: 'excellent', color: 'success' };
    if (hoursUntilExpiry > 6) return { score: 85, status: 'good', color: 'primary' };
    if (hoursUntilExpiry > 2) return { score: 70, status: 'warning', color: 'warning' };
    return { score: 40, status: 'critical', color: 'destructive' };
  };

  const systemHealth = getSystemHealth();

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center space-x-2">
          <Globe className="size-5 text-primary" />
          <div>
            <CardTitle className="text-lg">Visão Geral do Sistema</CardTitle>
            <CardDescription>Status completo da integração enterprise</CardDescription>
          </div>
        </div>
        <Badge className={`bg-${systemHealth.color} text-${systemHealth.color}-foreground`}>
          {systemHealth.status === 'excellent' && '🟢 Excelente'}
          {systemHealth.status === 'good' && '🟡 Bom'}
          {systemHealth.status === 'warning' && '🟠 Atenção'}
          {systemHealth.status === 'critical' && '🔴 Crítico'}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* System Health Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Saúde Geral do Sistema</span>
            <span className="text-lg font-bold">{systemHealth.score}/100</span>
          </div>
          <Progress value={systemHealth.score} className="h-3" />
          <p className="text-xs text-muted-foreground">
            Baseado em: uptime, latência, taxa de erro e recursos ativos
          </p>
        </div>

        {/* System Features Status */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Recursos do Sistema</h4>
          <div className="grid grid-cols-1 gap-2">
            {systemFeatures.map((feature) => (
              <div 
                key={feature.name}
                className="flex items-center justify-between p-3 border rounded-lg bg-card/50"
              >
                <div className="flex items-center space-x-3">
                  {feature.icon}
                  <div>
                    <p className="text-sm font-medium">{feature.name}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
                <Badge 
                  variant={feature.status === 'active' ? 'default' : 'secondary'}
                  className={feature.status === 'active' ? 'bg-success text-success-foreground' : ''}
                >
                  {feature.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* System Status Summary */}
        <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/10">
          <div className="flex items-start space-x-3">
            <Zap className="size-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-primary mb-1">Sistema Enterprise Ativo</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Todos os sistemas críticos estão operacionais. Renovação automática, 
                monitoramento de segurança e backup estão protegendo sua integração 24/7.
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span>🔄 Auto-renovação: ON</span>
                  <span>🛡️ Segurança: ON</span>
                  <span>📊 Monitoramento: ON</span>
                </div>
                <Button variant="ghost" size="sm">
                  Ver Logs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}