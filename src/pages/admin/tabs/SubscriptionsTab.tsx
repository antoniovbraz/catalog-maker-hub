import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DataVisualization } from "@/components/ui/data-visualization";
import { Badge } from "@/components/ui/badge";

interface SubscriptionTableRow {
  id: string;
  user?: {
    full_name: string | null;
    email: string | null;
  } | null;
  plan?: {
    display_name?: string;
    price_monthly?: number;
  } | null;
  status: string;
  current_period_end?: string | null;
}

function SubscriptionsTabComponent() {
  const { data: allSubscriptions = [], isLoading } = useQuery({
    queryKey: ["admin-subscriptions"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<SubscriptionTableRow[]> => {
      try {
        const { data: subscriptions, error: subError } = await supabase
          .from("subscriptions")
          .select("id, user_id, plan_id, status, current_period_end")
          .order("created_at", { ascending: false });

        if (subError) {
          console.error("Subscriptions basic query error:", subError);
          throw new Error(`Erro ao buscar assinaturas: ${subError.message}`);
        }

        if (!subscriptions || subscriptions.length === 0) {
          return [];
        }

        const userIds = [...new Set(subscriptions.map(sub => sub.user_id))];
        const planIds = [...new Set(subscriptions.map(sub => sub.plan_id))];

        const [{ data: users }, { data: plans }] = await Promise.all([
          supabase.from("profiles").select("id, full_name, email").in("id", userIds),
          supabase.from("subscription_plans").select("id, display_name, price_monthly").in("id", planIds)
        ]);

        const transformedData = subscriptions.map(sub => ({
          id: sub.id,
          status: sub.status,
          current_period_end: sub.current_period_end,
          user: users?.find(u => u.id === sub.user_id) || null,
          plan: plans?.find(p => p.id === sub.plan_id) || null
        }));

        return transformedData as SubscriptionTableRow[];
      } catch (error) {
        console.error("Subscriptions fetch error:", error);
        throw error;
      }
    }
  });

  const subscriptionColumns = [
    {
      key: "user.full_name",
      header: "Usuário",
      render: (item: SubscriptionTableRow) => (
        <div>
          <div className="font-medium">{item.user?.full_name || "N/A"}</div>
          <div className="text-sm text-muted-foreground">{item.user?.email}</div>
        </div>
      )
    },
    {
      key: "plan.display_name",
      header: "Plano",
      render: (item: SubscriptionTableRow) => (
        <Badge variant="outline">
          {item.plan?.display_name}
        </Badge>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (item: SubscriptionTableRow) => (
        <Badge variant={item.status === "active" ? "default" : "secondary"}>
          {item.status}
        </Badge>
      )
    },
    {
      key: "plan.price_monthly",
      header: "Valor Mensal",
      render: (item: SubscriptionTableRow) => `R$ ${(item.plan?.price_monthly || 0).toFixed(2)}`
    },
    {
      key: "current_period_end",
      header: "Período",
      render: (item: SubscriptionTableRow) => {
        if (!item.current_period_end) return "N/A";
        return new Date(item.current_period_end).toLocaleDateString("pt-BR");
      }
    }
  ];

  return (
    <DataVisualization
      title="Gestão de Assinaturas"
      description="Monitore todas as assinaturas ativas na plataforma"
      data={allSubscriptions}
      columns={subscriptionColumns}
      isLoading={isLoading}
    />
  );
}

export default memo(SubscriptionsTabComponent);

