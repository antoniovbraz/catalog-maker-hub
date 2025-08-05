import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataVisualization } from '@/components/ui/data-visualization';
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

  // Queries otimizadas separadas com error handling e cache
  const { data: allUsers, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['admin-users'],
    enabled: isSuperAdmin,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    queryFn: async (): Promise<UserTableRow[]> => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, company_name, created_at, is_active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Users query error:', error);
          throw new Error(`Erro ao buscar usuários: ${error.message}`);
        }
        return (data || []) as UserTableRow[];
      } catch (error) {
        console.error('Users fetch error:', error);
        throw error;
      }
    }
  });

  const { data: allSubscriptions, isLoading: subscriptionsLoading, error: subscriptionsError } = useQuery({
    queryKey: ['admin-subscriptions'],
    enabled: isSuperAdmin,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    queryFn: async (): Promise<SubscriptionTableRow[]> => {
      try {
        // Buscar assinaturas básicas primeiro
        const { data: subscriptions, error: subError } = await supabase
          .from('subscriptions')
          .select('id, user_id, plan_id, status, current_period_end')
          .order('created_at', { ascending: false });

        if (subError) {
          console.error('Subscriptions basic query error:', subError);
          throw new Error(`Erro ao buscar assinaturas: ${subError.message}`);
        }

        // Se não há assinaturas, retorna array vazio
        if (!subscriptions || subscriptions.length === 0) {
          return [];
        }

        // Buscar dados de usuários e planos separadamente
        const userIds = [...new Set(subscriptions.map(sub => sub.user_id))];
        const planIds = [...new Set(subscriptions.map(sub => sub.plan_id))];

        const [{ data: users }, { data: plans }] = await Promise.all([
          supabase.from('profiles').select('id, full_name, email').in('id', userIds),
          supabase.from('subscription_plans').select('id, display_name, price_monthly').in('id', planIds)
        ]);

        // Mapear dados
        const transformedData = subscriptions.map(sub => ({
          id: sub.id,
          status: sub.status,
          current_period_end: sub.current_period_end,
          user: users?.find(u => u.id === sub.user_id) || null,
          plan: plans?.find(p => p.id === sub.plan_id) || null
        }));
        
        return transformedData as SubscriptionTableRow[];
      } catch (error) {
        console.error('Subscriptions fetch error:', error);
        throw error;
      }
    }
  });

  const { data: revenue, isLoading: revenueLoading, error: revenueError } = useQuery({
    queryKey: ['admin-revenue'],
    enabled: isSuperAdmin,
    staleTime: 2 * 60 * 1000, // 2 minutos de cache (mais frequente)
    queryFn: async () => {
      try {
        // Buscar assinaturas ativas com planos
        const { data: activeSubscriptions, error } = await supabase
          .from('subscriptions')
          .select('plan_id')
          .eq('status', 'active');
        
        if (error) {
          console.error('Revenue subscriptions query error:', error);
          throw new Error(`Erro ao buscar assinaturas ativas: ${error.message}`);
        }

        if (!activeSubscriptions || activeSubscriptions.length === 0) {
          return {
            monthly: 0,
            yearly: 0,
            activeSubscriptions: 0
          };
        }

        // Buscar preços dos planos
        const planIds = [...new Set(activeSubscriptions.map(sub => sub.plan_id))];
        const { data: plans, error: plansError } = await supabase
          .from('subscription_plans')
          .select('id, price_monthly')
          .in('id', planIds);

        if (plansError) {
          console.error('Revenue plans query error:', plansError);
          throw new Error(`Erro ao buscar planos: ${plansError.message}`);
        }
        
        // Calcular receita total
        const monthlyRevenue = activeSubscriptions.reduce((total, sub) => {
          const plan = plans?.find(p => p.id === sub.plan_id);
          return total + (plan?.price_monthly || 0);
        }, 0);
        
        return {
          monthly: monthlyRevenue,
          yearly: monthlyRevenue * 12,
          activeSubscriptions: activeSubscriptions.length
        };
      } catch (error) {
        console.error('Revenue calculation error:', error);
        throw error;
      }
    }
  });

  // Verificar erros e mostrar mensagem apropriada
  if (usersError || subscriptionsError || revenueError) {
    const errorMessage = usersError?.message || subscriptionsError?.message || revenueError?.message || 'Erro desconhecido';
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Crown className="h-16 w-16 text-destructive mx-auto mb-md" />
          <Heading variant="h2" className="text-destructive mb-sm">
            Erro ao Carregar Dados
          </Heading>
          <Text className="text-muted-foreground">
            {errorMessage}
          </Text>
        </div>
      </div>
    );
  }

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
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Assinaturas Ativas",
      value: revenue?.activeSubscriptions || 0,
      icon: Crown,
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    },
    {
      title: "Receita Mensal",
      value: `R$ ${(revenue?.monthly || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      title: "Receita Anual (Proj.)",
      value: `R$ ${(revenue?.yearly || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: "text-warning",
      bgColor: "bg-warning/10"
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

  // Loading state otimizado com skeleton específico por seção
  const isLoading = usersLoading || subscriptionsLoading || revenueLoading;
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-32 bg-muted rounded animate-pulse" />
            <div className="h-9 w-36 bg-muted rounded animate-pulse" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="space-y-4">
          <div className="h-10 w-96 bg-muted rounded animate-pulse" />
          <div className="bg-card rounded-lg border p-6">
            <div className="space-y-4">
              <div className="h-6 w-48 bg-muted rounded animate-pulse" />
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
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
          <Card key={index} className="border-0 shadow-card">
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
