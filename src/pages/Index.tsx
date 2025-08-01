import { useState } from "react";
import { MarketplaceForm } from "@/components/forms/MarketplaceForm";
import { CategoryForm } from "@/components/forms/CategoryForm";
import { ProductForm } from "@/components/forms/ProductForm";
import { ShippingRuleForm } from "@/components/forms/ShippingRuleForm";
import { CommissionForm } from "@/components/forms/CommissionForm";
import { FixedFeeRuleForm } from "@/components/forms/FixedFeeRuleForm";
import { SalesForm } from "@/components/forms/SalesForm";
import { PricingForm } from "@/components/forms/PricingForm";
import { DashboardForm } from "@/components/forms/DashboardForm";
import { StrategyForm } from "@/components/forms/StrategyForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Sistema de Gestão de Marketplace
          </h1>
          <p className="text-xl text-muted-foreground">
            Gerencie marketplaces, categorias, produtos e regras de frete
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-10">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="strategy">Estratégia</TabsTrigger>
            <TabsTrigger value="marketplaces">Marketplaces</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="shipping">Frete</TabsTrigger>
            <TabsTrigger value="commissions">Comissões</TabsTrigger>
            <TabsTrigger value="fixedfees">Regras de valor fixo</TabsTrigger>
            <TabsTrigger value="sales">Vendas</TabsTrigger>
            <TabsTrigger value="pricing">Precificação</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard - Comparação de Preços</CardTitle>
                <CardDescription>
                  Compare preços e margens entre diferentes marketplaces para um produto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="strategy" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Estratégia de Precificação</CardTitle>
                <CardDescription>
                  Analise produtos por margem e giro de vendas usando matriz estratégica
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StrategyForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marketplaces" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Marketplaces</CardTitle>
                <CardDescription>
                  Cadastre e gerencie os marketplaces onde seus produtos são vendidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MarketplaceForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Categorias</CardTitle>
                <CardDescription>
                  Organize seus produtos em categorias para melhor gestão
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Produtos</CardTitle>
                <CardDescription>
                  Cadastre produtos com custos, impostos e categorias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Regras de Frete</CardTitle>
                <CardDescription>
                  Configure regras de frete por produto e marketplace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ShippingRuleForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Comissões</CardTitle>
                <CardDescription>
                  Configure comissões por marketplace e categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CommissionForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fixedfees" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Regras de valor fixo</CardTitle>
                <CardDescription>
                  Configure regras de valor fixo por marketplace com diferentes tipos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FixedFeeRuleForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Vendas</CardTitle>
                <CardDescription>
                  Registre vendas para cálculo de margens
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SalesForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Precificação</CardTitle>
                <CardDescription>
                  Calcule preços sugeridos e margens de lucro
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PricingForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;