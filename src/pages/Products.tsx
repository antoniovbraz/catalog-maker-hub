import { ProductForm } from "@/components/forms/ProductForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Products() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Produtos</CardTitle>
          <CardDescription>
            Cadastre produtos com custos, impostos e categorias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm />
        </CardContent>
      </Card>
    </div>
  );
}