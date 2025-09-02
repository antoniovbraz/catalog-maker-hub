import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DataVisualization } from "@/components/ui/data-visualization";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';

interface UserTableRow {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  company_name: string | null;
  created_at: string;
  is_active: boolean;
}

function UsersTabComponent() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ["admin-users", tenantId],
    staleTime: 5 * 60 * 1000,
    enabled: !!tenantId,
    queryFn: async (): Promise<UserTableRow[]> => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, email, role, company_name, created_at, is_active")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Users query error:", error);
          throw new Error(`Erro ao buscar usuários: ${error.message}`);
        }
        return (data || []) as UserTableRow[];
      } catch (error) {
        console.error("Users fetch error:", error);
        throw error;
      }
    }
  });

  const userColumns = [
    {
      key: "full_name",
      header: "Nome",
      render: (item: UserTableRow) => (
        <div>
          <div className="font-medium">{item.full_name || "N/A"}</div>
          <div className="text-sm text-muted-foreground">{item.email}</div>
        </div>
      )
    },
    {
      key: "role",
      header: "Role",
      render: (item: UserTableRow) => (
        <Badge variant={item.role === "super_admin" ? "destructive" : "secondary"}>
          {item.role}
        </Badge>
      )
    },
    {
      key: "company_name",
      header: "Empresa"
    },
    {
      key: "created_at",
      header: "Criado em",
      render: (item: UserTableRow) => new Date(String(item.created_at)).toLocaleDateString("pt-BR")
    },
    {
      key: "is_active",
      header: "Status",
      render: (item: UserTableRow) => (
        <Badge variant={item.is_active ? "default" : "secondary"}>
          {item.is_active ? "Ativo" : "Inativo"}
        </Badge>
      )
    }
  ];

  return (
    <DataVisualization
      title="Gestão de Usuários"
      description="Gerencie todos os usuários da plataforma"
      data={allUsers}
      columns={userColumns}
      isLoading={isLoading}
    />
  );
}

export default memo(UsersTabComponent);

