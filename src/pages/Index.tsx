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

// Dashboard avançado imports
import { PricingComparisonChart } from "@/components/charts/PricingComparisonChart";
import { MarginAnalysisChart } from "@/components/charts/MarginAnalysisChart";
import { RecommendationsPanel } from "@/components/dashboard/RecommendationsPanel";
import { MarketplacePerformanceTable } from "@/components/dashboard/MarketplacePerformanceTable";
import { usePricingComparisons, useBulkPricingCalculations } from "@/hooks/useBulkPricing";
import { generateRecommendations } from "@/utils/recommendations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from "lucide-react";

// Definição das abas com suas configurações
interface TabItem {
  id: string;
  label: string;
  value: string;
}

const defaultTabs: TabItem[] = [
  { id: "dashboard", label: "Dashboard", value: "dashboard" },
  { id: "strategy", label: "Estratégia", value: "strategy" },
  { id: "marketplaces", label: "Marketplaces", value: "marketplaces" },
  { id: "categories", label: "Categorias", value: "categories" },
  { id: "products", label: "Produtos", value: "products" },
  { id: "shipping", label: "Frete", value: "shipping" },
  { id: "commissions", label: "Comissões", value: "commissions" },
  { id: "fixedfees", label: "Regras de valor fixo", value: "fixedfees" },
  { id: "sales", label: "Vendas", value: "sales" },
  { id: "pricing", label: "Precificação", value: "pricing" },
];

// Componente para cada aba drag-and-drop
interface SortableTabProps {
  tab: TabItem;
}

const SortableTab = ({ tab }: SortableTabProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TabsTrigger 
      ref={setNodeRef} 
      style={style} 
      value={tab.value}
      className="group relative"
      {...attributes}
    >
      <div className="flex items-center gap-1">
        <span>{tab.label}</span>
        <div 
          {...listeners} 
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
    </TabsTrigger>
  );
};

const Index = () => {
  const [tabs, setTabs] = useState<TabItem[]>(defaultTabs);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Hooks para dashboard avançado
  const { data: comparisons = [] } = usePricingComparisons();
  const { data: bulkResults = [] } = useBulkPricingCalculations();
  const recommendations = generateRecommendations(comparisons, bulkResults);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTabs((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={tabs.map(tab => tab.id)} 
              strategy={horizontalListSortingStrategy}
            >
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
                {tabs.map((tab) => (
                  <SortableTab key={tab.id} tab={tab} />
                ))}
              </TabsList>
            </SortableContext>
          </DndContext>

          <TabsContent value="dashboard" className="mt-6">
            <div className="space-y-6">
              {/* Dashboard Avançado */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PricingComparisonChart comparisons={comparisons} />
                <MarginAnalysisChart comparisons={comparisons} />
              </div>
              
              <MarketplacePerformanceTable comparisons={comparisons} />
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <RecommendationsPanel 
                    recommendations={recommendations}
                    onRecommendationClick={(rec) => {
                      console.log('Recomendação clicada:', rec);
                      // Aqui poderia navegar para a aba relevante
                    }}
                  />
                </div>
                
                {/* Dashboard Form original como ferramenta complementar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Análise Individual</CardTitle>
                    <CardDescription>
                      Ferramenta para análise específica de produto
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DashboardForm />
                  </CardContent>
                </Card>
              </div>
            </div>
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