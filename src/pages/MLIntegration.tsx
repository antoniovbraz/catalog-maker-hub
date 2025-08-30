import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { MLConnectionCard } from "@/components/ml/MLConnectionCard";
import { MLSyncStatus } from "@/components/ml/MLSyncStatus";
import { MLProductList } from "@/components/ml/MLProductList";
import { MLHealthStatus } from "@/components/ml/MLHealthStatus";
import { MLNotificationCenter } from "@/components/ml/MLNotificationCenter";
import { MLAnalyticsCard } from "@/components/ml/MLAnalyticsCard";
import { MLMultiAccountManager } from "@/components/ml/MLMultiAccountManager";
import { MLSystemOverview } from "@/components/ml/MLSystemOverview";
import { ExternalLink } from "@/components/ui/icons";
import { useMLIntegration } from "@/hooks/useMLIntegration";
import { useMLCleanup } from "@/hooks/useMLCleanup";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

const MLIntegration = () => {
  const { auth } = useMLIntegration();
  const authStatus = auth;
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Ativar limpeza automática de dados temporários ML
  useMLCleanup();

  // Handle callback success/error messages
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'connected') {
      toast({
        title: "Sucesso!",
        description: "Conta do Mercado Livre conectada com sucesso!",
      });
      setSearchParams({}); // Clear URL parameters
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
      setSearchParams({}); // Clear URL parameters
    }
  }, [searchParams, setSearchParams]);

  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Mercado Livre" }
  ];

  return (
    <ConfigurationPageLayout
      title="Integração Mercado Livre"
      description="Conecte sua conta do Mercado Livre para sincronizar produtos e gerenciar vendas automaticamente."
      icon={<ExternalLink className="size-6" />}
      breadcrumbs={breadcrumbs}
    >
      {/* Connection Status */}
      <div className="col-span-12">
        <MLConnectionCard />
      </div>

      {/* Show enhanced status and monitoring components only if connected */}
      {authStatus?.isConnected && (
        <>
          {/* Row 1: System Overview spans full width */}
          <div className="col-span-12">
            <MLSystemOverview />
          </div>

          {/* Row 2: Health, Notifications, Sync Status */}
          <div className="col-span-12 lg:col-span-6 xl:col-span-4">
            <MLHealthStatus />
          </div>

          <div className="col-span-12 lg:col-span-6 xl:col-span-4">
            <MLNotificationCenter />
          </div>

          <div className="col-span-12 lg:col-span-6 xl:col-span-4">
            <MLSyncStatus />
          </div>

          {/* Row 3: Analytics and Advanced Management */}
          <div className="col-span-12 lg:col-span-6 xl:col-span-6">
            <MLAnalyticsCard />
          </div>

          <div className="col-span-12 lg:col-span-6 xl:col-span-6">
            <MLMultiAccountManager />
          </div>

          {/* Row 4: Product List */}
          <div className="col-span-12">
            <MLProductList />
          </div>
        </>
      )}

      {/* Help Section */}
      {!authStatus?.isConnected && (
        <div className="col-span-12 xl:col-span-8 xl:col-start-3">
          <div className="rounded-lg border border-dashed border-muted-foreground/25 p-6">
            <h3 className="mb-2 font-semibold">Como conectar ao Mercado Livre</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Clique em "Conectar com Mercado Livre" acima</li>
              <li>Você será redirecionado para a página de autorização do ML</li>
              <li>Faça login com sua conta do Mercado Livre</li>
              <li>Autorize o acesso à sua conta</li>
              <li>Você será redirecionado de volta e a conexão estará ativa</li>
            </ol>
          </div>
        </div>
      )}
    </ConfigurationPageLayout>
  );
};

export default MLIntegration;