import { Store, Plus, Upload, Download } from '@/components/ui/icons';
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { DataVisualization } from "@/components/ui/data-visualization";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { MarketplaceFormEnhanced } from "@/components/forms/enhanced/MarketplaceFormEnhanced";
import { useMarketplacesHierarchical, useDeleteMarketplace } from "@/hooks/useMarketplaces";
import { MarketplaceType } from "@/types/marketplaces";
import { useState } from "react";

const Marketplaces = () => {
  const { data: hierarchicalMarketplaces = [], isLoading } = useMarketplacesHierarchical();
  const deleteMutation = useDeleteMarketplace();
  const [editingMarketplace, setEditingMarketplace] = useState<MarketplaceType | null>(null);

  // Flatten hierarchical data for table view
  const flattenedMarketplaces = hierarchicalMarketplaces.flatMap(hierarchy => [
    hierarchy.parent,
    ...hierarchy.children
  ]);

  const totalMarketplaces = flattenedMarketplaces.length;
  const configuredMarketplaces = flattenedMarketplaces.filter(m => m.url && m.description).length;

  const columns = [
    {
      key: "name",
      header: "Nome",
      sortable: true,
      render: (marketplace: MarketplaceType) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{marketplace.name}</span>
          {marketplace.parent_marketplace_id && (
            <StatusBadge status="configured" label="Modalidade" size="sm" />
          )}
        </div>
      )
    },
    {
      key: "description",
      header: "Descrição",
      render: (marketplace: MarketplaceType) => (
        <span className="text-muted-foreground">
          {marketplace.description || "Sem descrição"}
        </span>
      )
    },
    {
      key: "url",
      header: "URL",
      render: (marketplace: MarketplaceType) => (
        marketplace.url ? (
          <a
            href={marketplace.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {marketplace.url}
          </a>
        ) : (
          <span className="text-muted-foreground">Não configurada</span>
        )
      )
    },
    {
      key: "status",
      header: "Status",
      render: (marketplace: MarketplaceType) => {
        const isConfigured = marketplace.url && marketplace.description;
        return (
          <StatusBadge
            status={isConfigured ? "configured" : "pending"}
            label={isConfigured ? "Configurado" : "Pendente"}
          />
        );
      }
    }
  ];

  const actions = [
    {
      label: "Editar",
      icon: <Store className="w-4 h-4" />,
      onClick: (marketplace: MarketplaceType) => setEditingMarketplace(marketplace),
      variant: "outline" as const
    },
    {
      label: "Excluir",
      icon: <Store className="w-4 h-4" />,
      onClick: (marketplace: MarketplaceType) => deleteMutation.mutate(marketplace.id),
      variant: "destructive" as const
    }
  ];

  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Marketplaces" }
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">
        <Upload className="w-4 h-4 mr-2" />
        Importar
      </Button>
      <Button variant="outline" size="sm">
        <Download className="w-4 h-4 mr-2" />
        Exportar
      </Button>
      <Button size="sm">
        <Plus className="w-4 h-4 mr-2" />
        Novo Marketplace
      </Button>
    </div>
  );

  return (
    <ConfigurationPageLayout
      title="Gerenciar Marketplaces"
      description="Configure os marketplaces onde seus produtos são vendidos. Organize por modalidades para melhor controle de comissões e regras específicas."
      icon={<Store className="w-6 h-6" />}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
      progressValue={configuredMarketplaces}
      progressTotal={totalMarketplaces}
    >
      {/* Form Column */}
      <div className="xl:col-span-5 space-y-lg">
        <MarketplaceFormEnhanced
          editingMarketplace={editingMarketplace}
          onCancelEdit={() => setEditingMarketplace(null)}
        />
      </div>

      {/* Data Visualization Column */}
      <div className="xl:col-span-7">
        <DataVisualization
          title="Marketplaces Cadastrados"
          description="Visualize e gerencie todos os marketplaces e suas modalidades"
          data={flattenedMarketplaces}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          searchable={true}
        />
      </div>
    </ConfigurationPageLayout>
  );
};

export default Marketplaces;

