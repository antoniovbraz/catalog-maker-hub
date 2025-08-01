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
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="p-6">
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
          </div>
        );
      case "estrategia":
        return (
          <div className="p-6">
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
          </div>
        );
      case "marketplaces":
        return (
          <div className="p-6">
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
          </div>
        );
      case "categorias":
        return (
          <div className="p-6">
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
          </div>
        );
      case "produtos":
        return (
          <div className="p-6">
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
          </div>
        );
      case "frete":
        return (
          <div className="p-6">
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
          </div>
        );
      case "comissoes":
        return (
          <div className="p-6">
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
          </div>
        );
      case "taxas-fixas":
        return (
          <div className="p-6">
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
          </div>
        );
      case "vendas":
        return (
          <div className="p-6">
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
          </div>
        );
      case "precificacao":
        return (
          <div className="p-6">
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
          </div>
        );
      default:
        return (
          <div className="p-6">
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
          </div>
        );
    }
  };

  return (
    <MainLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </MainLayout>
  );
};

export default Index;