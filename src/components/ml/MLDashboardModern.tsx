// Dashboard Mercado Livre Moderno - Fase 4 da refatoração
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Settings,
  Download,
  Upload,
  Link,
  Activity,
  BarChart3,
  ShoppingCart,
  Package,
  Zap,
  Shield,
  AlertTriangle
} from "lucide-react";

// Use new centralized ML service
import { 
  useMLIntegration, 
  useMLAuth, 
  useMLSync, 
  useMLSettings,
  useMLConnectionStatus,
  useMLHealthScore 
} from "@/hooks/useMLIntegration";
import { MLService } from "@/services/ml-service";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export function MLDashboardModern() {
  const [activeTab, setActiveTab] = useState("overview");

  // Use new centralized hooks
  const { 
    isConnected, 
    isLoading, 
    hasError,
    auth,
    sync,
    performance,
    settings,
    invalidateAllQueries 
  } = useMLIntegration();

  const { 
    isExpiringSoon, 
    connectionHealth, 
    userInfo 
  } = useMLConnectionStatus();

  const { 
    score: healthScore, 
    level: healthLevel, 
    recommendations 
  } = useMLHealthScore();

  // Actions hooks
  const { startAuth, refreshToken, disconnect } = useMLAuth();
  const { syncBatch, importFromML } = useMLSync();
  const { updateAdvancedSettings, backupConfiguration } = useMLSettings();

  // Handle auth actions
  const handleConnect = () => {
    startAuth.mutate();
  };

  const handleRefreshToken = () => {
    refreshToken.mutate();
  };

  const handleDisconnect = () => {
    disconnect.mutate();
  };

  const handleImportProducts = () => {
    importFromML.mutate();
  };

  const handleBackupConfig = () => {
    backupConfiguration.mutate();
  };

  // Loading states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-muted-foreground">Carregando integração ML...</span>
      </div>
    );
  }

  // Connection health indicator
  const getHealthBadge = () => {
    const healthConfig = {
      healthy: { label: "Saudável", color: "bg-success text-success-foreground", icon: CheckCircle2 },
      good: { label: "Bom", color: "bg-primary text-primary-foreground", icon: Activity },
      warning: { label: "Atenção", color: "bg-warning text-warning-foreground", icon: AlertTriangle },
      critical: { label: "Crítico", color: "bg-destructive text-destructive-foreground", icon: AlertCircle },
      disconnected: { label: "Desconectado", color: "bg-muted text-muted-foreground", icon: AlertCircle }
    };

    const config = healthConfig[connectionHealth];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Health score card
  const renderHealthScore = () => {
    if (!healthScore) return null;

    const getScoreColor = (level: string) => {
      switch (level) {
        case 'excellent': return 'text-green-600';
        case 'good': return 'text-blue-600';
        case 'fair': return 'text-yellow-600';
        case 'poor': return 'text-red-600';
        default: return 'text-gray-600';
      }
    };

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Score de Saúde
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getScoreColor(healthLevel)}`}>
            {healthScore}%
          </div>
          <p className="text-xs text-muted-foreground capitalize">
            {healthLevel === 'excellent' && 'Excelente'}
            {healthLevel === 'good' && 'Boa'}
            {healthLevel === 'fair' && 'Regular'}
            {healthLevel === 'poor' && 'Ruim'}
          </p>
          <Progress value={healthScore} className="mt-2" />
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Mercado Livre</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie sua integração com o Mercado Livre
            </p>
          </div>
          <div className="flex items-center gap-3">
            {getHealthBadge()}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={invalidateAllQueries}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Connection Status Alert */}
      {!isConnected ? (
        <Alert className="mb-6 border-warning bg-warning/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between w-full">
            <span>Sua conta do Mercado Livre não está conectada.</span>
            <Button size="sm" onClick={handleConnect} disabled={startAuth.isPending}>
              {startAuth.isPending ? <LoadingSpinner size="sm" /> : "Conectar Agora"}
            </Button>
          </AlertDescription>
        </Alert>
      ) : isExpiringSoon ? (
        <Alert className="mb-6 border-warning bg-warning/10">
          <Clock className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between w-full">
            <span>Sua sessão do ML expira em breve. Renove para manter a sincronização.</span>
            <Button size="sm" onClick={handleRefreshToken} disabled={refreshToken.isPending}>
              {refreshToken.isPending ? <LoadingSpinner size="sm" /> : "Renovar Token"}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Health Recommendations */}
      {recommendations.length > 0 && (
        <Alert className="mb-6">
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">Recomendações para melhorar a integração:</div>
            <ul className="list-disc list-inside space-y-1">
              {recommendations.map((rec, index) => (
                <li key={index} className="text-sm">{rec}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Connection Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Status da Conexão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-600">Conectado</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-600">Desconectado</span>
                </>
              )}
            </div>
            {userInfo.nickname && (
              <p className="text-xs text-muted-foreground mt-1">
                {userInfo.nickname} (ID: {userInfo.id})
              </p>
            )}
          </CardContent>
        </Card>

        {/* Sync Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sync?.status_counts?.total || 0}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-green-600">{sync?.status_counts?.synced || 0} sync</span>
              <span className="text-red-600">{sync?.status_counts?.error || 0} erro</span>
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Taxa de Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performance?.success_rate || 0}%
            </div>
            <div className="text-xs text-muted-foreground">
              {performance?.total_operations || 0} operações
            </div>
          </CardContent>
        </Card>

        {/* Health Score */}
        {renderHealthScore()}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>
                  Operações mais utilizadas da integração
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleImportProducts} 
                  disabled={!isConnected || importFromML.isPending}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {importFromML.isPending ? "Importando..." : "Importar Produtos do ML"}
                </Button>
                
                <Button 
                  onClick={handleBackupConfig}
                  disabled={!isConnected || backupConfiguration.isPending}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {backupConfiguration.isPending ? "Criando..." : "Backup das Configurações"}
                </Button>

                {isConnected && (
                  <Button 
                    onClick={handleDisconnect}
                    disabled={disconnect.isPending}
                    className="w-full justify-start"
                    variant="destructive"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {disconnect.isPending ? "Desconectando..." : "Desconectar Conta"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
                <CardDescription>
                  Últimas operações realizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {performance?.operations_by_type ? (
                  <div className="space-y-2">
                    {Object.entries(performance.operations_by_type).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma atividade recente
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status dos Produtos</CardTitle>
              <CardDescription>
                Estado atual da sincronização dos produtos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sync?.products ? (
                <div className="space-y-4">
                  {sync.products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sku}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            product.sync_status === 'synced' ? 'default' :
                            product.sync_status === 'error' ? 'destructive' :
                            'secondary'
                          }
                        >
                          {MLService.formatSyncStatus(product.sync_status).label}
                        </Badge>
                        {product.ml_permalink && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={product.ml_permalink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum produto sincronizado
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Performance</CardTitle>
                <CardDescription>
                  Últimos 7 dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                {performance ? (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total de Operações</span>
                      <span className="font-mono">{performance.total_operations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Operações Bem-sucedidas</span>
                      <span className="font-mono text-green-600">{performance.successful_operations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Operações com Erro</span>
                      <span className="font-mono text-red-600">{performance.failed_operations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tempo Médio de Resposta</span>
                      <span className="font-mono">{performance.average_response_time}ms</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Taxa de Sucesso</span>
                      <span className="font-mono">{performance.success_rate}%</span>
                    </div>
                    <Progress value={performance.success_rate} className="mt-2" />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Dados de performance não disponíveis
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operações por Tipo</CardTitle>
                <CardDescription>
                  Distribuição das operações
                </CardDescription>
              </CardHeader>
              <CardContent>
                {performance?.operations_by_type ? (
                  <div className="space-y-3">
                    {Object.entries(performance.operations_by_type).map(([type, count]) => {
                      const total = performance.total_operations;
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      
                      return (
                        <div key={type}>
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{type.replace('_', ' ')}</span>
                            <span>{count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <Progress value={percentage} className="mt-1" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma operação registrada
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
              <CardDescription>
                Configurações da integração ML
              </CardDescription>
            </CardHeader>
            <CardContent>
              {settings ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Feature Flags</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(settings.feature_flags).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key.replace('_', ' ')}</span>
                          <Badge variant={value ? "default" : "secondary"}>
                            {value ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Rate Limits</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(settings.rate_limits).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key.replace('_', ' ')}</span>
                          <span className="font-mono">{value}/h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>Auto Recovery</span>
                      <Badge variant={settings.auto_recovery_enabled ? "default" : "secondary"}>
                        {settings.auto_recovery_enabled ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Monitoring Avançado</span>
                      <Badge variant={settings.advanced_monitoring ? "default" : "secondary"}>
                        {settings.advanced_monitoring ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Multi-conta</span>
                      <Badge variant={settings.multi_account_enabled ? "default" : "secondary"}>
                        {settings.multi_account_enabled ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Backup Schedule</span>
                      <span className="font-mono">{settings.backup_schedule}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Configurações não disponíveis
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}