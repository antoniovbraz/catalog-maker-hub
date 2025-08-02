import { SalesForm } from "@/components/forms/SalesForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Sales = () => {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Vendas</CardTitle>
          <CardDescription>
            Registre vendas para cálculo de margens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalesForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default Sales;