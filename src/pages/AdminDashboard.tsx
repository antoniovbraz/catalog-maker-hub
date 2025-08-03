import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataVisualization } from '@/components/ui/data-visualization';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Heading, Text } from '@/components/ui/typography';
import { Crown, Users, TrendingUp, DollarSign, Activity, Settings, UserPlus, BarChart3 } from '@/components/ui/icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserTableRow {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  company_name: string | null;
  created_at: string;
  is_active: boolean;
}

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

export default function AdminDashboard() {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === 'super_admin';

  // Query única otimizada para todos os dados do admin
  const { data: adminData, isLoading: adminLoading, error: adminError } = useQuery({
    queryKey: ['admin-dashboard-data'],
    enabled: isSuperAdmin,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    queryFn: async () => {
      try {
        // Query otimizada com CTEs para buscar todos os dados em uma única requisição
        const { data, error } = await supabase.rpc('get_admin_dashboard_data');
        
        if (error) {
          console.error('Admin dashboard query error:', error);
          throw new Error(`Erro ao carregar dados do admin: ${error.message}`);
        }

        return data;
      } catch (error) {
        console.error('Admin dashboard error:', error);
        throw error;
      }
    }
  });

  // Separar dados da query única
  const allUsers = adminData?.users || [];
  const allSubscriptions = adminData?.subscriptions || [];
  const revenue = adminData?.revenue || {
    monthly: 0,
    yearly: 0,
    activeSubscriptions: 0
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Crown className="h-16 w-16 text-muted-foreground mx-auto mb-md" />
          <Heading variant="h2" className="text-destructive mb-sm">
            Acesso Restrito
          </Heading>
          <Text className="text-muted-foreground">
            Apenas super administradores podem acessar esta área.
          </Text>
        </div>
      </div>
    );
  }

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
      key: 'full_name',
      header: 'Nome',
      render: (item: UserTableRow) => (
        <div>
          <div className="font-medium">{item.full_name || 'N/A'}</div>
          <div className="text-sm text-muted-foreground">{item.email}</div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Role',
      render: (item: UserTableRow) => (
        <Badge variant={item.role === 'super_admin' ? 'destructive' : 'secondary'}>
          {item.role}
        </Badge>
      )
    },
    {
      key: 'company_name',
      header: 'Empresa'
    },
    {
      key: 'created_at',
      header: 'Criado em',
      render: (item: UserTableRow) => new Date(String(item.created_at)).toLocaleDateString('pt-BR')
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (item: UserTableRow) => (
        <Badge variant={item.is_active ? 'default' : 'secondary'}>
          {item.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    }
  ];

  const subscriptionColumns = [
    {
      key: 'user.full_name',
      header: 'Usuário',
      render: (item: SubscriptionTableRow) => (
        <div>
          <div className="font-medium">{item.user?.full_name || 'N/A'}</div>
          <div className="text-sm text-muted-foreground">{item.user?.email}</div>
        </div>
      )
    },
    {
      key: 'plan.display_name',
      header: 'Plano',
      render: (item: SubscriptionTableRow) => (
        <Badge variant="outline">
          {item.plan?.display_name}
        </Badge>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: SubscriptionTableRow) => (
        <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
          {item.status}
        </Badge>
      )
    },
    {
      key: 'plan.price_monthly',
      header: 'Valor Mensal',
      render: (item: SubscriptionTableRow) => `R$ ${(item.plan?.price_monthly || 0).toFixed(2)}`
    },
    {
      key: 'current_period_end',
      header: 'Período',
      render: (item: SubscriptionTableRow) => {
        if (!item.current_period_end) return 'N/A';
        return new Date(item.current_period_end).toLocaleDateString('pt-BR');
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
            <CardContent className="p-lg">
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
      <Tabs defaultValue="users" className="space-y-lg">
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

        <TabsContent value="users" className="space-y-lg">
          <DataVisualization
            title="Gestão de Usuários"
            description="Gerencie todos os usuários da plataforma"
            data={allUsers || []}
            columns={userColumns}
          />
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-lg">
          <DataVisualization
            title="Gestão de Assinaturas"
            description="Monitore todas as assinaturas ativas na plataforma"
            data={allSubscriptions || []}
            columns={subscriptionColumns}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-lg">
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
