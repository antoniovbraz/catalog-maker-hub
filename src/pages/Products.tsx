import { ProductForm } from "@/components/forms/ProductForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Package } from "@/components/ui/icons";

const Products = () => {
  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Produtos" }
  ];

  return (
    <ConfigurationPageLayout
      title="Gerenciar Produtos"
      description="Cadastre e gerencie produtos com custos, impostos e categorias"
      icon={<Package className="w-6 h-6" />}
      breadcrumbs={breadcrumbs}
    >
      <ProductForm />
    </ConfigurationPageLayout>
  );
};

export default Products;
