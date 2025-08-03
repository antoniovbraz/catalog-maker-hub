import { ProductForm } from "@/components/forms/ProductForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Products = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">📦 Produtos</h1>
        <p className="text-muted-foreground">
          Cadastre e gerencie produtos com custos, impostos e categorias
        </p>
      </div>

      {/* Main Content */}
      <Card className="shadow-card border-0 bg-gradient-subtle">
        <CardContent className="p-6">
          <ProductForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;