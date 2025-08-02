import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionPlans, useCurrentSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/common/DataTable';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Crown, Users, TrendingUp, DollarSign, Activity, Settings, UserPlus, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AdminDashboard() {
  const { profile } = useAuth();
  
  // Verificar se é super admin
  if (profile?.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Crown className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-destructive mb-2">
            Acesso Restrito
          </h1>
          <p className="text-muted-foreground">
            Apenas super administradores podem acessar esta área.
          </p>
        </div>
      </div>
    );
  }

  // Queries para dados do admin
  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: allSubscriptions, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:subscription_plans(*),
          user:profiles(full_name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:subscription_plans(price_monthly, price_yearly)
        `)
        .eq('status', 'active');
      
      if (error) throw error;
      
      // Calcular receita mensal total
      const monthlyRevenue = data?.reduce((total, sub) => {
        return total + (sub.plan?.price_monthly || 0);
      }, 0) || 0;
      
      return {
        monthly: monthlyRevenue,
        yearly: monthlyRevenue * 12,
        activeSubscriptions: data?.length || 0
      };
    }
  });

  const stats = [
    {
      title: "Total de Usuários",
      value: allUsers?.length || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Assinaturas Ativas", 
      value: revenue?.activeSubscriptions || 0,
      icon: Crown,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Receita Mensal",
      value: `R$ ${(revenue?.monthly || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Receita Anual (Proj.)",
      value: `R$ ${(revenue?.yearly || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: "text-orange-600", 
      bgColor: "bg-orange-50"
    }
  ];

  const userColumns = [
    {
      key: "name",
      header: "Nome",
      accessorKey: "full_name",
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.full_name || 'N/A'}</div>
          <div className="text-sm text-muted-foreground">{row.original.email}</div>
        </div>
      )
    },
    {
      key: "role",
      header: "Role",
      accessorKey: "role",
      cell: ({ row }: any) => (
        <Badge variant={row.original.role === 'super_admin' ? 'destructive' : 'secondary'}>
          {row.original.role}
        </Badge>
      )
    },
    {
      key: "company",
      header: "Empresa",
      accessorKey: "company_name"
    },
    {
      key: "created",
      header: "Criado em",
      accessorKey: "created_at",
      cell: ({ row }: any) => new Date(row.original.created_at).toLocaleDateString('pt-BR')
    },
    {
      key: "status",
      header: "Status",
      accessorKey: "is_active",
      cell: ({ row }: any) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    }
  ];

  const subscriptionColumns = [
    {
      key: "user",
      header: "Usuário",
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.user?.full_name || 'N/A'}</div>
          <div className="text-sm text-muted-foreground">{row.original.user?.email}</div>
        </div>
      )
    },
    {
      key: "plan",
      header: "Plano",
      cell: ({ row }: any) => (
        <Badge variant="outline">
          {row.original.plan?.display_name}
        </Badge>
      )
    },
    {
      key: "status",
      header: "Status",
      accessorKey: "status",
      cell: ({ row }: any) => (
        <Badge variant={row.original.status === 'active' ? 'default' : 'secondary'}>
          {row.original.status}
        </Badge>
      )
    },
    {
      key: "value",
      header: "Valor Mensal",
      cell: ({ row }: any) => `R$ ${(row.original.plan?.price_monthly || 0).toFixed(2)}`
    },
    {
      key: "period",
      header: "Período",
      cell: ({ row }: any) => {
        if (!row.original.current_period_end) return 'N/A';
        return new Date(row.original.current_period_end).toLocaleDateString('pt-BR');
      }
    }
  ];

  if (usersLoading || subscriptionsLoading || revenueLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando dashboard..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            Dashboard Admin
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral da plataforma Peepers Hub
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button size="sm">
            <UserPlus className="w-4 h-4 mr-2" />
            Convidar Usuário
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Assinaturas
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Gestão de Usuários
              </CardTitle>
              <CardDescription>
                Gerencie todos os usuários da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={userColumns}
                data={allUsers || []}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Gestão de Assinaturas
              </CardTitle>
              <CardDescription>
                Monitore todas as assinaturas ativas na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={subscriptionColumns}
                data={allSubscriptions || []}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Analytics em Desenvolvimento
                </CardTitle>
                <CardDescription>
                  Métricas avançadas estarão disponíveis em breve
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12">
                <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Funcionalidade em Desenvolvimento
                </h3>
                <p className="text-muted-foreground">
                  Gráficos de uso, conversão e retenção serão implementados na próxima versão.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}