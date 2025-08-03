import { ProductForm } from "@/components/forms/ProductForm";
import { Card, CardContent } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";

const Products = () => {
  return (
    <div className="space-y-lg">
      {/* Page Header */}
      <div className="space-y-sm">
        <Heading variant="h1" className="tracking-tight">
          📦 Produtos
        </Heading>
        <Text className="text-muted-foreground">
          Cadastre e gerencie produtos com custos, impostos e categorias
        </Text>
      </div>

      {/* Main Content */}
      <Card className="shadow-card border-0 bg-gradient-subtle">
        <CardContent className="p-lg">
          <ProductForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;
