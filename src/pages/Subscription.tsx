import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Check, Crown, Zap, Star, ArrowRight, Infinity } from '@/components/ui/icons';
import { useSubscriptionPlans, useCurrentSubscription, useUsageTracking } from '@/hooks/useSubscription';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Heading, Text } from "@/components/ui/typography";

export default function Subscription() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: currentSubscription } = useCurrentSubscription();
  const { data: usage } = useUsageTracking();

  if (plansLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando planos..." />
      </div>
    );
  }

  if (!plans?.length) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <EmptyState
          icon={<Crown className="size-8" />}
          title="Nenhum plano disponível"
          description="Os planos de assinatura ainda não foram configurados."
        />
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'free': return <Zap className="size-5" />;
      case 'basic': return <Star className="size-5" />;
      case 'pro': return <Crown className="size-5" />;
      case 'enterprise': return <Crown className="size-5" />;
      default: return <Zap className="size-5" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'free':
        return 'bg-muted text-muted-foreground';
      case 'basic':
        return 'bg-secondary text-secondary-foreground';
      case 'pro':
        return 'bg-primary text-primary-foreground';
      case 'enterprise':
        return 'bg-gradient-primary text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.plan_id === planId;
  };

  const getUsagePercentage = (resourceType: string, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    const currentUsage = usage?.find(u => u.resource_type === resourceType)?.current_usage || 0;
    return Math.min((currentUsage / limit) * 100, 100);
  };

  const getCurrentUsage = (resourceType: string) => {
    return usage?.find(u => u.resource_type === resourceType)?.current_usage || 0;
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-primary/10">
          <Crown className="size-8 text-primary" />
        </div>
        <Heading
          variant="h1"
          className="mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text"
          style={{ color: 'transparent' }}
        >
          Escolha seu Plano
        </Heading>
        <Text variant="muted" className="mx-auto max-w-2xl">
          Desbloqueie todo o potencial do Peepers Hub com ferramentas avançadas para seu marketplace
        </Text>
      </div>

      {/* Current Subscription Status */}
      {currentSubscription && (
        <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className={getPlanColor(currentSubscription.plan?.name || '')}>
                {getPlanIcon(currentSubscription.plan?.name || '')}
                {currentSubscription.plan?.display_name}
              </Badge>
              <span className="text-lg">Plano Atual</span>
            </CardTitle>
            <CardDescription>
              Status: <Badge variant={currentSubscription.status === 'active' ? 'default' : 'secondary'}>
                {currentSubscription.status === 'active' ? 'Ativo' : currentSubscription.status}
              </Badge>
              {currentSubscription.current_period_end && (
                <span className="ml-4">
                  Renovação: {new Date(currentSubscription.current_period_end).toLocaleDateString('pt-BR')}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-md">
            <Heading variant="h4" className="mb-3">Uso do Período Atual</Heading>
            
            {/* Products Usage */}
            <div className="space-y-sm">
              <div className="flex justify-between">
                <Text variant="caption">Produtos</Text>
                <Text variant="caption">
                  {getCurrentUsage('products')} / {
                    currentSubscription.plan?.limits?.products === -1 ? '∞' : currentSubscription.plan?.limits?.products
                  }
                </Text>
              </div>
              {currentSubscription.plan?.limits?.products !== -1 && (
                <Progress value={getUsagePercentage('products', currentSubscription.plan?.limits?.products || 0)} />
              )}
            </div>

            {/* API Calls Usage */}
            <div className="space-y-sm">
              <div className="flex justify-between">
                <Text variant="caption">Chamadas API</Text>
                <Text variant="caption">
                  {getCurrentUsage('api_calls_month')} / {
                    currentSubscription.plan?.limits?.api_calls_month === -1 ? '∞' : currentSubscription.plan?.limits?.api_calls_month
                  }
                </Text>
              </div>
              {currentSubscription.plan?.limits?.api_calls_month !== -1 && (
                <Progress value={getUsagePercentage('api_calls_month', currentSubscription.plan?.limits?.api_calls_month || 0)} />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Cycle Toggle */}
      <div className="mb-8 flex justify-center">
        <div className="rounded-lg bg-muted p-xs">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-background text-foreground shadow-hover'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-background text-foreground shadow-hover'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Anual
            <Badge variant="secondary" className="ml-2">20% OFF</Badge>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
          const isCurrent = isCurrentPlan(plan.id);
          const isRecommended = plan.name === 'pro';
          
          return (
            <Card 
              key={plan.id}
              className={`relative ${isRecommended ? 'scale-105 border-primary shadow-card' : ''} ${
                isCurrent ? 'ring-2 ring-primary/50' : ''
              }`}
            >
              {isRecommended && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  Recomendado
                </Badge>
              )}
              
              {isCurrent && (
                <Badge className="absolute -top-3 right-4 bg-success">
                  Atual
                </Badge>
              )}

              <CardHeader className="text-center">
                <div className={`mb-4 inline-flex size-12 items-center justify-center rounded-full ${getPlanColor(plan.name)}`}>
                  {getPlanIcon(plan.name)}
                </div>
                
                <CardTitle className="text-xl">{plan.display_name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                
                <div className="mt-4">
                  <span className="text-3xl font-bold">{formatPrice(price || 0)}</span>
                  <span className="text-muted-foreground">/{billingCycle === 'yearly' ? 'ano' : 'mês'}</span>
                  {billingCycle === 'yearly' && plan.price_yearly && plan.price_monthly && (
                    <div className="text-sm text-muted-foreground">
                      Economize {formatPrice((plan.price_monthly * 12) - plan.price_yearly)}
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-md">
                {/* Features */}
                <div className="space-y-sm">
                  <Heading variant="h4" className="text-sm">Recursos inclusos:</Heading>
                  <ul className="space-y-xs">
                    {Object.entries(plan.features || {}).map(([feature, enabled]) => {
                      if (!enabled) return null;

                      const featureLabels: Record<string, string> = {
                        price_pilot: 'Price Pilot',
                        basic_analytics: 'Analytics Básico',
                        advanced_analytics: 'Analytics Avançado',
                        email_support: 'Suporte por Email',
                        priority_support: 'Suporte Prioritário',
                        bulk_operations: 'Operações em Lote',
                        custom_reports: 'Relatórios Personalizados',
                        api_access: 'Acesso à API',
                        multi_user: 'Multi-usuários',
                        custom_integrations: 'Integrações Personalizadas'
                      };

                      return (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="size-4 text-success" />
                          <Text variant="caption">{featureLabels[feature] || feature}</Text>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <Separator />

                {/* Limits */}
                <div className="space-y-sm">
                  <Heading variant="h4" className="text-sm">Limites:</Heading>
                  <ul className="space-y-xs text-muted-foreground">
                    {Object.entries(plan.limits || {}).map(([limit, value]) => {
                      const limitLabels: Record<string, string> = {
                        products: 'Produtos',
                        marketplaces: 'Marketplaces',
                        api_calls_month: 'Chamadas API/mês',
                        users: 'Usuários'
                      };

                      return (
                        <li key={limit} className="flex justify-between">
                          <Text variant="caption">{limitLabels[limit] || limit}:</Text>
                          <Text variant="caption" className="font-medium">
                            {value === -1 ? <Infinity className="inline size-4" /> : value.toLocaleString()}
                          </Text>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <Button 
                  className={`w-full ${isCurrent ? 'opacity-50' : ''}`}
                  disabled={isCurrent}
                  variant={isRecommended ? 'default' : 'outline'}
                >
                  {isCurrent ? 'Plano Atual' : 'Escolher Plano'}
                  {!isCurrent && <ArrowRight className="ml-2 size-4" />}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ or Additional Info */}
      <div className="mt-16 text-center">
        <Heading variant="h3" className="mb-4">
          Precisa de ajuda para escolher?
        </Heading>
        <Text variant="muted" className="mb-6">
          Nossa equipe está pronta para ajudar você a encontrar o plano ideal para seu negócio.
        </Text>
        <Button variant="outline" size="lg">
          Falar com Vendas
        </Button>
      </div>
    </div>
  );
}