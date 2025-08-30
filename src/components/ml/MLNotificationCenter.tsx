import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, AlertTriangle, Info } from "@/components/ui/icons";
import { useMLAuth } from "@/hooks/useMLAuth";

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: Date;
}

export function MLNotificationCenter() {
  const { data: authStatus } = useMLAuth();

  const getNotifications = (): Notification[] => {
    const notifications: Notification[] = [];

    if (!authStatus?.connected) {
      notifications.push({
        id: 'disconnected',
        type: 'error',
        title: 'Integração Desconectada',
        message: 'Conecte sua conta do Mercado Livre para sincronizar produtos.',
        timestamp: new Date()
      });
      return notifications;
    }

    // Verificar status do token
    const expiresAt = new Date(authStatus.expires_at || '');
    const now = new Date();
    const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilExpiry <= 0) {
      notifications.push({
        id: 'token-expired',
        type: 'error',
        title: 'Token Expirado',
        message: 'Renovação automática em andamento.',
        timestamp: new Date()
      });
    } else if (hoursUntilExpiry <= 2) {
      notifications.push({
        id: 'token-expiring',
        type: 'warning',
        title: 'Renovação Agendada',
        message: 'Token será renovado automaticamente em breve.',
        timestamp: new Date()
      });
    } else {
      notifications.push({
        id: 'system-healthy',
        type: 'success',
        title: 'Sistema Operacional',
        message: 'Integração funcionando perfeitamente.',
        timestamp: new Date()
      });
    }

    // Sistema de renovação automática sempre ativo
    notifications.push({
      id: 'auto-renewal',
      type: 'info',
      title: 'Renovação Automática',
      message: 'Sistema monitora e renova tokens automaticamente.',
      timestamp: new Date()
    });

    return notifications.slice(0, 3); // Mostrar apenas 3 mais recentes
  };

  const notifications = getNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="size-4 text-success" />;
      case 'warning': return <AlertTriangle className="size-4 text-warning" />;
      case 'error': return <AlertTriangle className="size-4 text-destructive" />;
      default: return <Info className="size-4 text-primary" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'success': return <Badge className="bg-success text-success-foreground">OK</Badge>;
      case 'warning': return <Badge className="bg-warning text-warning-foreground">Atenção</Badge>;
      case 'error': return <Badge variant="destructive">Erro</Badge>;
      default: return <Badge variant="secondary">Info</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center space-x-3">
          <Bell className="size-5 text-primary" />
          <div>
            <CardTitle className="text-lg">Central de Notificações</CardTitle>
            <CardDescription>
              Atualizações da integração ML
            </CardDescription>
          </div>
        </div>
        <Badge variant="secondary">{notifications.length}</Badge>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {notifications.map((notification) => (
          <div 
            key={notification.id}
            className="flex items-start space-x-3 p-3 rounded-lg bg-card/50 border"
          >
            {getNotificationIcon(notification.type)}
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{notification.title}</p>
                {getNotificationBadge(notification.type)}
              </div>
              <p className="text-xs text-muted-foreground">{notification.message}</p>
            </div>
          </div>
        ))}
        
        {notifications.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            <Bell className="size-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma notificação</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}