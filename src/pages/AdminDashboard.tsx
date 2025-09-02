import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heading, Text } from '@/components/ui/typography';
import { Crown, Users, TrendingUp, DollarSign, Activity, Settings, UserPlus, BarChart3 } from '@/components/ui/icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { lazy, Suspense } from 'react';

const UsersTab = lazy(() => import('./admin/tabs/UsersTab'));
const SubscriptionsTab = lazy(() => import('./admin/tabs/SubscriptionsTab'));


export default function AdminDashboard() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const isSuperAdmin = profile?.role === 'super_admin';

  // Queries otimizadas separadas com error handling e cache
  const { data: userCount = 0, isLoading: userCountLoading, error: userCountError } = useQuery({
    queryKey: ['admin-user-count', tenantId],
    enabled: isSuperAdmin && !!tenantId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });
      if (error) {
        console.error('User count query error:', error);
        throw new Error(`Erro ao buscar total de usuários: ${error.message}`);
      }
      return count || 0;
    }
  });

  const { data: revenue, isLoading: revenueLoading, error: revenueError } = useQuery({
    queryKey: ['admin-revenue', tenantId],
    enabled: isSuperAdmin && !!tenantId,
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
  if (userCountError || revenueError) {
    const errorMessage = userCountError?.message || revenueError?.message || 'Erro desconhecido';
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Crown className="mx-auto mb-md size-16 text-destructive" />
          <Heading variant="h2" className="mb-sm text-destructive">
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Crown className="mx-auto mb-md size-16 text-muted-foreground" />
          <Heading variant="h2" className="mb-sm text-destructive">
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
      value: userCount,
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

  // Loading state otimizado com skeleton específico por seção
  const isLoading = userCountLoading || revenueLoading;
  
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header skeleton */}
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 animate-pulse rounded bg-muted" />
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-32 animate-pulse rounded bg-muted" />
            <div className="h-9 w-36 animate-pulse rounded bg-muted" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                </div>
                <div className="size-12 animate-pulse rounded-full bg-muted" />
              </div>
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="space-y-4">
          <div className="h-10 w-96 animate-pulse rounded bg-muted" />
          <div className="rounded-lg border bg-card p-6">
            <div className="space-y-4">
              <div className="h-6 w-48 animate-pulse rounded bg-muted" />
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-muted" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="size-6 text-primary" />
            </div>
            Dashboard Admin
          </h1>
          <p className="mt-1 text-muted-foreground">
            Visão geral da plataforma Peepers Hub
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="mr-2 size-4" />
            Configurações
          </Button>
          <Button size="sm">
            <UserPlus className="mr-2 size-4" />
            Convidar Usuário
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-md">
            <CardContent className="p-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">
                    {stat.value}
                  </p>
                </div>
                <div className={`size-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`size-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="users" className="space-y-lg">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" aria-controls="users-content" className="flex items-center gap-2">
            <Users className="size-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="subscriptions" aria-controls="subscriptions-content" className="flex items-center gap-2">
            <Crown className="size-4" />
            Assinaturas
          </TabsTrigger>
          <TabsTrigger value="analytics" aria-controls="analytics-content" className="flex items-center gap-2">
            <Activity className="size-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" id="users-content" className="space-y-lg">
          <Suspense fallback={<div className="p-4">Carregando...</div>}>
            <UsersTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="subscriptions" id="subscriptions-content" className="space-y-lg">
          <Suspense fallback={<div className="p-4">Carregando...</div>}>
            <SubscriptionsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="analytics" id="analytics-content" className="space-y-lg">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="size-5" />
                  Analytics em Desenvolvimento
                </CardTitle>
                <CardDescription>
                  Métricas avançadas estarão disponíveis em breve
                </CardDescription>
              </CardHeader>
              <CardContent className="py-12 text-center">
                <Activity className="mx-auto mb-4 size-16 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">
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
