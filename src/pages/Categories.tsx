import { CategoryForm } from "@/components/forms/CategoryForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { FolderTree } from "@/components/ui/icons";

const Categories = () => {
  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Categorias" }
  ];

  return (
    <ConfigurationPageLayout
      title="Gerenciar Categorias"
      description="Organize seus produtos em categorias para melhor gestão"
      icon={<FolderTree className="w-6 h-6" />}
      breadcrumbs={breadcrumbs}
    >
      <div className="xl:col-span-6">
        <CategoryForm />
      </div>
    </ConfigurationPageLayout>
  );
};

export default Categories;
