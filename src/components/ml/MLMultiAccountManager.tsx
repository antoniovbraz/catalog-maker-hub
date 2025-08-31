import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Settings, Store, UserCheck, RefreshCw, Shield, Zap } from "@/components/ui/icons";
import { useMLIntegration } from "@/hooks/useMLIntegration";
import { useState } from "react";

interface MLAccount {
  id: string;
  nickname: string;
  user_id_ml: number;
  status: 'active' | 'inactive' | 'expired';
  lastSync: Date;
}

export function MLMultiAccountManager() {
  const { auth } = useMLIntegration();
  const authStatus = auth;
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  // Simulação de múltiplas contas (futura implementação)
  const mockAccounts: MLAccount[] = [
    {
      id: '1',
      nickname: authStatus?.ml_nickname || 'Loja Principal',
      user_id_ml: authStatus?.user_id_ml || 0,
      status: authStatus?.isConnected ? 'active' : 'inactive',
      lastSync: new Date()
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-success text-success-foreground">🟢 Ativo</Badge>;
      case 'expired': return <Badge className="bg-warning text-warning-foreground">🟡 Expirado</Badge>;
      default: return <Badge variant="destructive">🔴 Inativo</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <UserCheck className="size-4 text-success" />;
      case 'expired': return <RefreshCw className="size-4 text-warning" />;
      default: return <Store className="size-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center space-x-2">
          <Settings className="size-5 text-primary" />
          <div>
            <CardTitle className="text-lg">Gerenciamento Avançado</CardTitle>
            <CardDescription>Controles e configurações enterprise</CardDescription>
          </div>
        </div>
        <Badge variant="secondary">Premium</Badge>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Account Management */}
        <div className="space-y-3">
          <h4 className="flex items-center space-x-2 text-sm font-medium">
            <Store className="size-4" />
            <span>Contas Conectadas</span>
          </h4>
          
          {mockAccounts.map((account) => (
            <div 
              key={account.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(account.status)}
                <div>
                  <p className="font-medium">{account.nickname}</p>
                  <p className="text-xs text-muted-foreground">
                    ID: {account.user_id_ml}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {getStatusBadge(account.status)}
                {account.status === 'active' && (
                  <Button variant="ghost" size="sm">
                    <Settings className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Advanced Features */}
        <div className="space-y-3">
          <h4 className="flex items-center space-x-2 text-sm font-medium">
            <Zap className="size-4" />
            <span>Recursos Premium</span>
          </h4>
          
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="justify-start" disabled>
              <Shield className="mr-2 size-4" />
              Backup Automático
            </Button>
            
            <Button variant="outline" size="sm" className="justify-start" disabled>
              <Store className="mr-2 size-4" />
              Multi-Loja
            </Button>
            
            <Button variant="outline" size="sm" className="justify-start" disabled>
              <RefreshCw className="mr-2 size-4" />
              Sync Avançado
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="justify-start text-destructive">
                  <Settings className="mr-2 size-4" />
                  Reset Total
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Completo da Integração</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá desconectar todas as contas, limpar dados de sincronização 
                    e resetar todas as configurações. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground">
                    Confirmar Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Premium Notice */}
        <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/10 to-secondary/10 p-4">
          <div className="mb-2 flex items-center space-x-2">
            <Zap className="size-4 text-primary" />
            <h4 className="font-medium text-primary">Recursos Premium</h4>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Funcionalidades avançadas como multi-conta, backup automático e sincronização 
            inteligente estão disponíveis nos planos pagos.
          </p>
          <Button size="sm" className="w-full">
            Upgrade para Premium
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}