import { Store, Plus, Upload, Download } from "lucide-react";
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
    }
  ];

  const actions = [
    {
      label: "Editar",
      icon: <Store className="w-4 h-4" />,
      onClick: (marketplace: MarketplaceType) => setEditingMarketplace(marketplace),
      variant: "outline" as const
    }
  ];

  return (
    <ConfigurationPageLayout
      title="Gerenciar Marketplaces"
      description="Configure os marketplaces onde seus produtos são vendidos"
      icon={<Store className="w-6 h-6" />}
      progressValue={configuredMarketplaces}
      progressTotal={totalMarketplaces}
    >
      <div className="xl:col-span-5">
        <MarketplaceFormEnhanced 
          editingMarketplace={editingMarketplace}
          onCancelEdit={() => setEditingMarketplace(null)}
        />
      </div>
      <div className="xl:col-span-7">
        <DataVisualization
          title="Marketplaces Cadastrados"
          data={flattenedMarketplaces}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
        />
      </div>
    </ConfigurationPageLayout>
  );
};

export default Marketplaces;