import { useEffect, useRef } from "react";
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

  const hasMutatedRef = useRef(false);

  useEffect(() => {
    if (error) {
      console.error('OAuth Error:', error);
      const errorMessage = error === 'access_denied' 
        ? 'Acesso negado pelo usuário' 
        : `Erro OAuth: ${error}`;
      navigate(`/integrations/mercado-livre?error=${encodeURIComponent(errorMessage)}`);
      return;
    }

    if (code && state) {
      console.log('Processing ML callback with PKCE...', { 
        codeLength: code.length, 
        state: state.substring(0, 20) + '...' 
      });
      
      if (!hasMutatedRef.current) {
        hasMutatedRef.current = true;
        callbackMutation.mutate(code, {
          onSuccess: () => {
            console.log('ML callback successful, redirecting...');
            navigate('/integrations/mercado-livre?success=connected');
          },
          onError: (err: Error) => {
            console.error('ML callback failed:', err);
            const errorParam = encodeURIComponent(err.message);
            navigate(`/integrations/mercado-livre?error=${errorParam}`);
          }
        });
      }
    } else {
      console.error('Missing required callback parameters:', { code: !!code, state: !!state });
      navigate('/integrations/mercado-livre?error=invalid_callback');
    }
  }, [code, state, error, navigate, callbackMutation]); // Incluir callbackMutation

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <AlertCircle className="size-12 text-destructive" />
            <div className="text-center">
              <h2 className="mb-2 text-lg font-semibold text-foreground">
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
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <CheckCircle2 className="size-12 text-success" />
            <div className="text-center">
              <h2 className="mb-2 text-lg font-semibold text-foreground">
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
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center space-y-4 p-6">
          <LoadingSpinner size="lg" />
            <div className="text-center">
              <h2 className="mb-2 text-lg font-semibold text-foreground">
                Conectando...
              </h2>
              <p className="text-sm text-muted-foreground">
                Processando sua autorização do Mercado Livre com segurança PKCE.
              </p>
              {callbackMutation.isPending && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Aguarde enquanto validamos sua autenticação...
                </p>
              )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}