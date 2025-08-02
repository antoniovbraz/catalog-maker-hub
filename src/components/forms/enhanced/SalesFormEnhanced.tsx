import { useState } from "react";
import { Receipt, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SmartForm } from "@/components/ui/smart-form";
import { DataVisualization } from "@/components/ui/data-visualization";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { SalesForm } from "@/components/forms/SalesForm";

interface Sale {
  id: string;
  product_id: string;
  marketplace_id: string;
  quantity: number;
  price_charged: number;
  sold_at: string;
  products: { name: string };
  marketplaces: { name: string };
}

export function SalesFormEnhanced() {
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const { data: sales = [], isLoading, refetch } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          product_id,
          marketplace_id,
          quantity,
          price_charged,
          sold_at,
          products!inner(name),
          marketplaces!inner(name)
        `)
        .order('sold_at', { ascending: false });

      if (error) throw error;
      return data as Sale[];
    }
  });

  const calculateMargin = (sale: Sale) => {
    // Simple margin calculation for display
    const revenue = sale.price_charged * sale.quantity;
    const margin = ((revenue - (revenue * 0.15)) / revenue) * 100; // Assuming 15% cost
    return margin;
  };

  const getMarginStatus = (margin: number) => {
    if (margin >= 30) return "active";
    if (margin >= 15) return "warning";
    return "error";
  };

  const getMarginLabel = (margin: number) => {
    if (margin >= 30) return "Excelente";
    if (margin >= 15) return "Boa";
    return "Baixa";
  };

  const columns = [
    {
      key: "sold_at",
      header: "Data",
      sortable: true,
      render: (item: Sale) => new Date(item.sold_at).toLocaleDateString('pt-BR')
    },
    {
      key: "products.name",
      header: "Produto",
      sortable: true,
      render: (item: Sale) => item.products.name
    },
    {
      key: "marketplaces.name",
      header: "Marketplace",
      sortable: true,
      render: (item: Sale) => item.marketplaces.name
    },
    {
      key: "quantity",
      header: "Quantidade",
      sortable: true,
    },
    {
      key: "price_charged",
      header: "Preço Unitário",
      sortable: true,
      render: (item: Sale) => `R$ ${item.price_charged.toFixed(2)}`
    },
    {
      key: "margin",
      header: "Margem Estimada",
      sortable: true,
      render: (item: Sale) => {
        const margin = calculateMargin(item);
        return (
          <StatusBadge 
            status={getMarginStatus(margin)} 
            label={`${margin.toFixed(1)}% - ${getMarginLabel(margin)}`}
          />
        );
      }
    },
    {
      key: "total_revenue",
      header: "Receita Total",
      sortable: true,
      render: (item: Sale) => `R$ ${(item.price_charged * item.quantity).toFixed(2)}`
    }
  ];

  const actions = [
    {
      label: "Editar",
      icon: <Edit className="w-4 h-4" />,
      onClick: (sale: Sale) => {
        setEditingSale(sale);
        setShowForm(true);
      },
      variant: "outline" as const
    },
    {
      label: "Excluir",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (sale: Sale) => {
        // TODO: Implement delete
        console.log("Delete sale:", sale.id);
      },
      variant: "destructive" as const
    }
  ];

  const formSections = showForm ? [
    {
      id: "venda",
      title: editingSale ? "Editar Venda" : "Nova Venda",
      description: "Registre os detalhes da venda realizada",
      icon: <Receipt className="h-5 w-5" />,
      children: (
        <SalesForm />
      )
    }
  ] : [
    {
      id: "historico",
      title: "Histórico de Vendas",
      description: "Todas as vendas registradas com análise de margem real",
      icon: <Eye className="h-5 w-5" />,
      children: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Venda
            </Button>
          </div>
          
          <DataVisualization
            title="Vendas Realizadas"
            data={sales.map(sale => ({ ...sale, id: sale.id }))}
            columns={columns}
            actions={actions}
            searchable={true}
            isLoading={isLoading}
            emptyState={
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Nenhuma venda registrada ainda</p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Primeira Venda
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
      title="Registro de Vendas"
      sections={formSections}
      onCancel={showForm ? () => {
        setShowForm(false);
        setEditingSale(null);
      } : undefined}
    />
  );
}