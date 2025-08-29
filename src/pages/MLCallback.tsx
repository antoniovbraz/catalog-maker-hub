import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMLAuthCallback } from "@/hooks/useMLAuth";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "@/components/ui/icons";

export default function MLCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const callbackMutation = useMLAuthCallback();

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      console.error('OAuth Error:', error);
      navigate('/integrations/mercado-livre?error=oauth_failed');
      return;
    }

    if (code && state) {
      callbackMutation.mutate(code, {
        onSuccess: () => {
          navigate('/integrations/mercado-livre?success=connected');
        },
        onError: () => {
          navigate('/integrations/mercado-livre?error=connection_failed');
        }
      });
    } else {
      navigate('/integrations/mercado-livre?error=invalid_callback');
    }
  }, [code, state, error, callbackMutation, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <AlertCircle className="size-12 text-destructive" />
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Erro na Conexão
              </h2>
              <p className="text-sm text-muted-foreground">
                Ocorreu um erro ao conectar com o Mercado Livre. Tente novamente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (callbackMutation.isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <CheckCircle2 className="size-12 text-success" />
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Conexão Realizada!
              </h2>
              <p className="text-sm text-muted-foreground">
                Sua conta do Mercado Livre foi conectada com sucesso.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center space-y-4 p-6">
          <LoadingSpinner size="lg" />
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Conectando...
            </h2>
            <p className="text-sm text-muted-foreground">
              Processando sua autorização do Mercado Livre.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}