import { useState } from "react";
import { Truck, Calculator, Settings, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SmartForm } from "@/components/ui/smart-form";
import { DataVisualization } from "@/components/ui/data-visualization";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ShippingRuleForm } from "@/components/forms/ShippingRuleForm";

interface ShippingRule {
  id: string;
  product_id: string;
  marketplace_id: string;
  shipping_cost: number;
  products: { name: string };
  marketplaces: { name: string };
}

export function ShippingRuleFormEnhanced() {
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<ShippingRule | null>(null);

  const { data: shippingRules = [], isLoading, refetch } = useQuery({
    queryKey: ['shipping-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_rules')
        .select(`
          id,
          product_id,
          marketplace_id,
          shipping_cost,
          products!inner(name),
          marketplaces!inner(name)
        `)
        .order('shipping_cost', { ascending: false });

      if (error) throw error;
      return data as ShippingRule[];
    }
  });

  const getShippingStatus = (cost: number) => {
    if (cost === 0) return "active";
    if (cost <= 10) return "warning";
    return "error";
  };

  const getShippingLabel = (cost: number) => {
    if (cost === 0) return "Grátis";
    return `R$ ${cost.toFixed(2)}`;
  };

  const columns = [
    {
      key: "products.name",
      header: "Produto",
      sortable: true,
      render: (item: ShippingRule) => item.products.name
    },
    {
      key: "marketplaces.name",
      header: "Marketplace",
      sortable: true,
      render: (item: ShippingRule) => item.marketplaces.name
    },
    {
      key: "shipping_cost",
      header: "Custo de Frete",
      sortable: true,
      render: (item: ShippingRule) => (
        <StatusBadge 
          status={getShippingStatus(item.shipping_cost)} 
          label={getShippingLabel(item.shipping_cost)}
        />
      )
    }
  ];

  const actions = [
    {
      label: "Editar",
      icon: <Edit className="w-4 h-4" />,
      onClick: (rule: ShippingRule) => {
        setEditingRule(rule);
        setShowForm(true);
      },
      variant: "outline" as const
    },
    {
      label: "Excluir",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (rule: ShippingRule) => {
        // TODO: Implement delete
        console.log("Delete rule:", rule.id);
      },
      variant: "destructive" as const
    }
  ];

  const formSections = showForm ? [
    {
      id: "regra",
      title: editingRule ? "Editar Regra de Frete" : "Nova Regra de Frete",
      description: "Configure os custos de frete por produto e marketplace",
      icon: <Truck className="h-5 w-5" />,
      children: (
        <ShippingRuleForm />
      )
    }
  ] : [
    {
      id: "regras",
      title: "Regras de Frete Configuradas",
      description: "Gerenciar regras de frete personalizadas por produto e marketplace",
      icon: <Eye className="h-5 w-5" />,
      children: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Regra
            </Button>
          </div>
          
          <DataVisualization
            title="Regras de Frete"
            data={shippingRules.map(rule => ({ ...rule, id: rule.id }))}
            columns={columns}
            actions={actions}
            searchable={true}
            isLoading={isLoading}
            emptyState={
              <div className="text-center py-8">
                <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Nenhuma regra de frete configurada ainda</p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Regra
                </Button>
              </div>
            }
          />
        </div>
      )
    }
  ];

  return (
    <SmartForm
      title="Regras de Frete"
      sections={formSections}
      onCancel={showForm ? () => {
        setShowForm(false);
        setEditingRule(null);
      } : undefined}
    />
  );
}