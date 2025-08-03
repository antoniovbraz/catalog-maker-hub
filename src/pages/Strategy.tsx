import { StrategyForm } from "@/components/forms/StrategyForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Strategy = () => {
  return (
    <div className="p-lg">
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
};

export default Strategy;