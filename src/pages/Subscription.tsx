import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Check, Crown, Zap, Star, ArrowRight, Infinity } from 'lucide-react';
import { useSubscriptionPlans, useCurrentSubscription, useUsageTracking } from '@/hooks/useSubscription';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/ui/empty-state';

export default function Subscription() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: currentSubscription } = useCurrentSubscription();
  const { data: usage } = useUsageTracking();

  if (plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando planos..." />
      </div>
    );
  }

  if (!plans?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState
          icon={<Crown className="h-8 w-8" />}
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
      case 'free': return <Zap className="h-5 w-5" />;
      case 'basic': return <Star className="h-5 w-5" />;
      case 'pro': return <Crown className="h-5 w-5" />;
      case 'enterprise': return <Crown className="h-5 w-5" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'free': return 'bg-muted text-muted-foreground';
      case 'basic': return 'bg-blue-500 text-white';
      case 'pro': return 'bg-purple-500 text-white';
      case 'enterprise': return 'bg-gradient-to-r from-purple-600 to-blue-600 text-white';
      default: return 'bg-muted text-muted-foreground';
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
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <Crown className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
          Escolha seu Plano
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Desbloqueie todo o potencial do Peepers Hub com ferramentas avançadas para seu marketplace
        </p>
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
          
          <CardContent className="space-y-4">
            <h4 className="font-semibold mb-3">Uso do Período Atual</h4>
            
            {/* Products Usage */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Produtos</span>
                <span>
                  {getCurrentUsage('products')} / {
                    currentSubscription.plan?.limits?.products === -1 ? '∞' : currentSubscription.plan?.limits?.products
                  }
                </span>
              </div>
              {currentSubscription.plan?.limits?.products !== -1 && (
                <Progress value={getUsagePercentage('products', currentSubscription.plan?.limits?.products || 0)} />
              )}
            </div>

            {/* API Calls Usage */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Chamadas API</span>
                <span>
                  {getCurrentUsage('api_calls_month')} / {
                    currentSubscription.plan?.limits?.api_calls_month === -1 ? '∞' : currentSubscription.plan?.limits?.api_calls_month
                  }
                </span>
              </div>
              {currentSubscription.plan?.limits?.api_calls_month !== -1 && (
                <Progress value={getUsagePercentage('api_calls_month', currentSubscription.plan?.limits?.api_calls_month || 0)} />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-muted p-1 rounded-lg">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'yearly' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Anual
            <Badge variant="secondary" className="ml-2">20% OFF</Badge>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
          const isCurrent = isCurrentPlan(plan.id);
          const isRecommended = plan.name === 'pro';
          
          return (
            <Card 
              key={plan.id}
              className={`relative ${isRecommended ? 'border-primary shadow-lg scale-105' : ''} ${
                isCurrent ? 'ring-2 ring-primary/50' : ''
              }`}
            >
              {isRecommended && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                  Recomendado
                </Badge>
              )}
              
              {isCurrent && (
                <Badge className="absolute -top-3 right-4 bg-green-600">
                  Atual
                </Badge>
              )}

              <CardHeader className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${getPlanColor(plan.name)}`}>
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

              <CardContent className="space-y-4">
                {/* Features */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Recursos inclusos:</h4>
                  <ul className="space-y-1 text-sm">
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
                          <Check className="h-4 w-4 text-green-600" />
                          {featureLabels[feature] || feature}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <Separator />

                {/* Limits */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Limites:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {Object.entries(plan.limits || {}).map(([limit, value]) => {
                      const limitLabels: Record<string, string> = {
                        products: 'Produtos',
                        marketplaces: 'Marketplaces',
                        api_calls_month: 'Chamadas API/mês',
                        users: 'Usuários'
                      };
                      
                      return (
                        <li key={limit} className="flex justify-between">
                          <span>{limitLabels[limit] || limit}:</span>
                          <span className="font-medium">
                            {value === -1 ? <Infinity className="h-4 w-4 inline" /> : value.toLocaleString()}
                          </span>
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
                  {!isCurrent && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ or Additional Info */}
      <div className="mt-16 text-center">
        <h3 className="text-2xl font-bold mb-4">Precisa de ajuda para escolher?</h3>
        <p className="text-muted-foreground mb-6">
          Nossa equipe está pronta para ajudar você a encontrar o plano ideal para seu negócio.
        </p>
        <Button variant="outline" size="lg">
          Falar com Vendas
        </Button>
      </div>
    </div>
  );
}