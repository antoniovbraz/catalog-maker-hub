import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { MLConnectionCard } from "@/components/ml/MLConnectionCard";
import { MLSyncStatus } from "@/components/ml/MLSyncStatus";
import { MLProductList } from "@/components/ml/MLProductList";
import { ExternalLink } from "@/components/ui/icons";
import { useMLAuth } from "@/hooks/useMLAuth";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

const MLIntegration = () => {
  const { data: authStatus } = useMLAuth();
  const [searchParams, setSearchParams] = useSearchParams();

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
      let errorMessage = "Erro ao conectar com o Mercado Livre";
      switch (error) {
        case 'oauth_failed':
          errorMessage = "Falha na autorização OAuth";
          break;
        case 'connection_failed':
          errorMessage = "Falha na conexão com o Mercado Livre";
          break;
        case 'invalid_callback':
          errorMessage = "Parâmetros de callback inválidos";
          break;
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
      <div className="space-y-6">
        {/* Connection Status */}
        <div className="col-span-full">
          <MLConnectionCard />
        </div>

        {/* Show sync components only if connected */}
        {authStatus?.connected && (
          <>
            {/* Sync Status Overview */}
            <div className="col-span-full lg:col-span-6">
              <MLSyncStatus />
            </div>

            {/* Product List */}
            <div className="col-span-full">
              <MLProductList />
            </div>
          </>
        )}

        {/* Help Section */}
        {!authStatus?.connected && (
          <div className="col-span-full">
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
      </div>
    </ConfigurationPageLayout>
  );
};

export default MLIntegration;