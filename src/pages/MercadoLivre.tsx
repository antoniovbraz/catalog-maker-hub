import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Settings, ShoppingCart, BarChart3, Database } from "@/components/ui/icons";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { MLConnectionCard } from "@/components/ml/MLConnectionCard";
import { MLStatusOverview } from "@/components/ml/MLStatusOverview";
import { MLHealthStatus } from "@/components/ml/MLHealthStatus";
import { MLNotificationCenter } from "@/components/ml/MLNotificationCenter";
import { MLSyncStatus } from "@/components/ml/MLSyncStatus";
import { MLAnalyticsCard } from "@/components/ml/MLAnalyticsCard";
import { MLProductList } from "@/components/ml/MLProductList";
import { MLMultiAccountManager } from "@/components/ml/MLMultiAccountManager";
import { useMLIntegration, ML_QUERY_KEYS } from "@/hooks/useMLIntegration";
import { useMLCleanup } from "@/hooks/useMLCleanup";
import { useGlobalModal } from "@/hooks/useGlobalModal";
import { useToast } from "@/hooks/use-toast";
import { MLSyncSettingsModal } from "@/components/forms/MLSyncSettingsModal";
import { useQueryClient } from "@tanstack/react-query";
import { MLService } from "@/services/ml-service";
import { useAuth } from "@/contexts/AuthContext";

const MercadoLivre = () => {
  const { auth } = useMLIntegration();
  const authStatus = auth;
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("connection");
  const { showFormModal } = useGlobalModal();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  // Ativar limpeza automática de dados temporários ML
  useMLCleanup();

  // Prefetch products when entering route
  useEffect(() => {
    if (profile?.tenant_id) {
      queryClient.prefetchInfiniteQuery({
        queryKey: ML_QUERY_KEYS.products(profile.tenant_id),
        queryFn: () => MLService.getMLProducts(),
        initialPageParam: 0,
        getNextPageParam: () => undefined,
      });
    }
  }, [profile?.tenant_id, queryClient]);

  // Handle callback success/error messages
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'connected') {
      toast({
        title: "Sucesso!",
        description: "Conta do Mercado Livre conectada com sucesso!",
      });
      setSearchParams({});
      setActiveTab("dashboard"); // Switch to dashboard after connection
    }

    if (error) {
      let errorMessage = decodeURIComponent(error);
      
      // Tratar erros específicos conhecidos
      if (error.includes('oauth_failed')) {
        errorMessage = "Falha na autorização OAuth";
      } else if (error.includes('connection_failed')) {
        errorMessage = "Falha na conexão com o Mercado Livre";
      } else if (error.includes('invalid_callback')) {
        errorMessage = "Parâmetros de callback inválidos";
      } else if (error.includes('PKCE')) {
        errorMessage = "Erro na validação de segurança. Tente novamente.";
      } else if (error.includes('code_verifier')) {
        errorMessage = "Erro técnico na autenticação. Reconecte sua conta.";
      } else if (error.includes('expired')) {
        errorMessage = "Sessão de autenticação expirada. Tente conectar novamente.";
      }
      
      toast({
        title: "Erro na Conexão",
        description: errorMessage,
        variant: "destructive",
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, toast]);

  // Auto-switch to dashboard only after successful connection
  useEffect(() => {
    if (authStatus?.isConnected && activeTab === "connection" && searchParams.get('success') === 'connected') {
      setActiveTab("dashboard");
    }
  }, [authStatus?.isConnected, activeTab, searchParams]);

  const handleSyncSettings = () => {
    let submitForm: (() => Promise<void>) | null = null;

    showFormModal({
      title: "Configurações de Sincronização",
      description: "Configure como os produtos serão sincronizados com o Mercado Livre",
      content: (
        <MLSyncSettingsModal
          onSuccess={() => {}}
          onSubmitForm={(fn) => {
            submitForm = fn;
          }}
        />
      ),
      onSave: async () => {
        if (submitForm) await submitForm();
      },
      size: "lg",
    });
  };

  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Mercado Livre" }
  ];

  const headerActions = authStatus?.isConnected ? (
    <Button size="sm" variant="outline" onClick={handleSyncSettings}>
      <Settings className="mr-2 size-4" />
      Configurações
    </Button>
  ) : null;

  return (
    <ConfigurationPageLayout
      title="Integração Mercado Livre"
      description="Conecte sua conta do Mercado Livre para sincronizar produtos e gerenciar vendas automaticamente."
      icon={<ExternalLink className="size-6" />}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      <div className="col-span-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="connection">
              <ExternalLink className="mr-2 size-4" />
              Conexão
            </TabsTrigger>
            <TabsTrigger value="dashboard" disabled={!authStatus?.isConnected}>
              <BarChart3 className="mr-2 size-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="products" disabled={!authStatus?.isConnected}>
              <ShoppingCart className="mr-2 size-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="settings" disabled={!authStatus?.isConnected}>
              <Database className="mr-2 size-4" />
              Avançado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="space-y-6">
            <MLConnectionCard />
            
            {!authStatus?.isConnected && (
              <Card>
                <CardHeader>
                  <CardTitle>Como conectar ao Mercado Livre</CardTitle>
                  <CardDescription>
                    Siga os passos abaixo para conectar sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="list-inside list-decimal space-y-2 text-sm">
                    <li>Clique em "Conectar com Mercado Livre" acima</li>
                    <li>Você será redirecionado para a página de autorização do ML</li>
                    <li>Faça login com sua conta do Mercado Livre</li>
                    <li>Autorize o acesso à sua conta</li>
                    <li>Você será redirecionado de volta e a conexão estará ativa</li>
                  </ol>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* System Overview */}
              <MLStatusOverview />

              {/* Health and Status Row */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <MLHealthStatus />
                <MLNotificationCenter />
                <MLSyncStatus />
              </div>

              {/* Analytics and Management Row */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <MLAnalyticsCard />
                <MLMultiAccountManager />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <MLProductList />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Avançadas</CardTitle>
                <CardDescription>
                  Configurações avançadas da integração com Mercado Livre
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Sincronização Automática</h4>
                      <p className="text-sm text-muted-foreground">
                        Ativar sincronização automática de produtos e pedidos
                      </p>
                    </div>
                    <Badge variant="outline">Em breve</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Backup Automático</h4>
                      <p className="text-sm text-muted-foreground">
                        Backup automático das configurações ML
                      </p>
                    </div>
                    <Badge variant="outline">Em breve</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Multi-contas</h4>
                      <p className="text-sm text-muted-foreground">
                        Gerenciar múltiplas contas do Mercado Livre
                      </p>
                    </div>
                    <Badge variant="outline">Em breve</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ConfigurationPageLayout>
  );
};

export default MercadoLivre;