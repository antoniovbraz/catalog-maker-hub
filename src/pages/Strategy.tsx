import { StrategyForm } from "@/components/forms/StrategyForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Strategy() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Estratégia de Precificação</CardTitle>
          <CardDescription>
            Analise produtos por margem e giro de vendas usando matriz estratégica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StrategyForm />
        </CardContent>
      </Card>
    </div>
  );
}