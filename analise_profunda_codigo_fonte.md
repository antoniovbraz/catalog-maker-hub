# Análise Profunda do Código Fonte - Peepers Hub

## Resumo Executivo

Após análise detalhada do código fonte da aplicação Peepers Hub, identifiquei uma aplicação bem estruturada tecnicamente, mas com oportunidades significativas de melhoria em design system, consistência visual e experiência do usuário. A aplicação utiliza tecnologias modernas (React, TypeScript, Tailwind CSS, Shadcn/UI) mas apresenta problemas de implementação que afetam a usabilidade e aparência profissional.

## Estrutura Técnica Atual

### ✅ **Pontos Fortes Identificados:**

1. **Arquitetura Sólida:**
   - React 18 com TypeScript
   - Roteamento bem estruturado com React Router
   - Gerenciamento de estado com TanStack Query
   - Autenticação robusta com Supabase
   - Testes configurados (Vitest, Playwright)

2. **Design System Parcial:**
   - Uso do Shadcn/UI como base
   - Tokens de design definidos em `src/styles/tokens.ts`
   - Sistema de temas implementado (light, dark, corporate, windows7)
   - Componentes customizados em `src/components/ui/`

3. **Funcionalidades Avançadas:**
   - Drag & drop implementado (@dnd-kit)
   - Componentes de visualização (Sparkline, gráficos)
   - Sistema de tooltips avançados
   - Onboarding tour implementado

### 🔴 **Problemas Críticos Identificados:**

---

## 1. PROBLEMAS DE DESIGN SYSTEM

### 1.1 Inconsistência na Aplicação de Tokens

**Problema:** Os tokens de design estão definidos mas não são aplicados consistentemente.

**Evidências no Código:**
```typescript
// src/styles/tokens.ts - Tokens bem definidos
export const spacing = {
  xs: 'var(--spacing-xs)',
  sm: 'var(--spacing-sm)',
  md: 'var(--spacing-md)',
  // ...
}

// Mas no código dos componentes:
// src/components/layout/AppSidebar.tsx
<SidebarHeader className="p-lg"> // ❌ Usando classe Tailwind direta
<div className="space-y-md">     // ❌ Misturando tokens com Tailwind
```

**Impacto:** Inconsistência visual e dificuldade de manutenção.

### 1.2 Sistema de Cores Confuso

**Problema:** Múltiplos temas definidos mas implementação confusa.

**Evidências:**
```css
/* src/index.css - 4 temas diferentes */
:root { /* Classic Light Theme */ }
.corporate { /* Corporate Theme */ }
.windows7 { /* Windows 7 Theme */ }
.dark { /* Dark Theme */ }
```

**Problemas Específicos:**
- Temas não são utilizados de forma consistente
- Cores de marketplace hardcoded em vários lugares
- Falta de hierarquia clara entre cores primárias e secundárias

### 1.3 Tipografia Inconsistente

**Problema:** Sistema tipográfico definido mas mal implementado.

**Evidências:**
```typescript
// src/components/ui/typography.tsx - Componentes bem estruturados
export const Heading = ({ variant, children, className, ...props }) => {
  // Implementação correta
}

// Mas usado inconsistentemente:
// src/pages/Dashboard.tsx
<Heading variant="h1" className="bg-gradient-to-r..."> // ✅ Correto
// vs outros lugares usando classes diretas do Tailwind
```

---

## 2. PROBLEMAS DE COMPONENTES

### 2.1 Menu Lateral Sobrecarregado

**Problema:** Estrutura complexa demais no `AppSidebar.tsx`.

**Evidências:**
```typescript
// src/components/layout/AppSidebar.tsx
const mainMenuItems = [/* 2 itens */];
const configMenuItems = [/* 5 itens */];
const operationsMenuItems = [/* 4 itens */];
// + seção Admin + seção Conta = 13+ itens visíveis
```

**Problemas Específicos:**
- Muitos grupos de navegação
- Lógica complexa de collapsible com localStorage
- Estados de abertura/fechamento confusos
- Ícones inconsistentes

### 2.2 Dashboard Form Excessivamente Complexo

**Problema:** `DashboardForm.tsx` tem 400+ linhas com múltiplas responsabilidades.

**Evidências:**
```typescript
// src/components/forms/DashboardForm.tsx
export const DashboardForm = () => {
  // 15+ estados locais
  // 5+ hooks customizados
  // Lógica de drag & drop
  // Cálculos de preço
  // Salvamento automático
  // Renderização de cards
  // etc...
}
```

**Problemas:**
- Violação do princípio de responsabilidade única
- Difícil manutenção e teste
- Performance prejudicada
- Código difícil de entender

### 2.3 Cards com Estilos Inconsistentes

**Problema:** Múltiplos tipos de cards com estilos diferentes.

**Evidências:**
```typescript
// BaseCard.tsx - Implementação genérica
<Card ref={ref} className={className} {...props}>

// Mas usado com estilos inline em vários lugares:
// DashboardForm.tsx
<Card className="group relative bg-gradient-to-br from-card to-card/50
  transition-all duration-300 ease-in-out hover:scale-[1.02]...">
```

---

## 3. PROBLEMAS DE LAYOUT E RESPONSIVIDADE

### 3.1 Grid System Inconsistente

**Problema:** Uso inconsistente de grids e layouts responsivos.

**Evidências:**
```typescript
// Categories.tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

// vs ConfigurationPageLayout.tsx
<div className="lg:col-span-6 xl:col-span-6">
<div className="lg:col-span-6 xl:col-span-6">
```

**Problemas:**
- Breakpoints não padronizados
- Layouts que não se adaptam bem
- Espaçamentos inconsistentes

### 3.2 Sidebar Responsividade Limitada

**Problema:** Menu lateral não otimizado para mobile.

**Evidências:**
```typescript
// AppSidebar.tsx
<Sidebar collapsible="icon" className="border-r-0 bg-sidebar">
// Apenas colapsa para ícones, sem considerar mobile adequadamente
```

---

## 4. PROBLEMAS DE PERFORMANCE

### 4.1 Re-renders Desnecessários

**Problema:** Componentes complexos re-renderizam frequentemente.

**Evidências:**
```typescript
// DashboardForm.tsx
const transformedResults = savedPricings.map(pricing => {
  // Cálculo complexo executado a cada render
  const realMargin = realMargins[pricing.marketplace_id];
  return { /* objeto complexo */ };
});
```

### 4.2 Queries Não Otimizadas

**Problema:** Múltiplas queries executadas simultaneamente.

**Evidências:**
```typescript
// DashboardForm.tsx
const { data: products = [] } = useQuery({ queryKey: ["products"] });
const { data: marketplaces = [] } = useQuery({ queryKey: ["marketplaces"] });
const { data: savedPricings = [] } = useQuery({ queryKey: ["saved-pricing"] });
// Todas executam independentemente
```

---

## 5. PROBLEMAS DE ACESSIBILIDADE

### 5.1 Falta de Labels Adequados

**Problema:** Elementos interativos sem labels apropriados.

**Evidências:**
```typescript
// AppSidebar.tsx
{collapsed && <div className="sr-only">{item.title}</div>}
// Solução parcial, mas inconsistente
```

### 5.2 Contraste Insuficiente

**Problema:** Algumas combinações de cores não atendem WCAG.

**Evidências:**
```css
/* index.css */
--muted-foreground: 215 16% 47%; /* Pode ter contraste insuficiente */
```

---

## 6. PROBLEMAS DE MANUTENIBILIDADE

### 6.1 Código Duplicado

**Problema:** Lógica similar repetida em vários componentes.

**Evidências:**
- Lógica de formulários repetida
- Estilos de cards duplicados
- Validações similares em múltiplos lugares

### 6.2 Falta de Documentação

**Problema:** Componentes complexos sem documentação adequada.

**Evidências:**
- Props interfaces sem comentários
- Lógica complexa sem explicação
- Hooks customizados sem documentação

---

## 7. ANÁLISE DE ARQUITETURA

### 7.1 Estrutura de Pastas Adequada

**✅ Pontos Positivos:**
```
src/
├── components/
│   ├── auth/
│   ├── charts/
│   ├── common/
│   ├── forms/
│   ├── layout/
│   ├── ui/
├── hooks/
├── pages/
├── services/
├── types/
├── utils/
```

### 7.2 Separação de Responsabilidades

**🔄 Melhorias Necessárias:**
- Componentes muito grandes (DashboardForm)
- Lógica de negócio misturada com UI
- Hooks com múltiplas responsabilidades

---

## 8. RECOMENDAÇÕES PRIORITÁRIAS

### Fase 1: Design System (1-2 semanas)
1. **Padronizar uso de tokens**
2. **Simplificar sistema de temas**
3. **Criar componentes base consistentes**

### Fase 2: Refatoração de Componentes (2-3 semanas)
1. **Quebrar DashboardForm em componentes menores**
2. **Simplificar AppSidebar**
3. **Padronizar todos os cards**

### Fase 3: Performance e Acessibilidade (1-2 semanas)
1. **Otimizar re-renders**
2. **Implementar lazy loading**
3. **Melhorar acessibilidade**

### Fase 4: Responsividade (1 semana)
1. **Otimizar para mobile**
2. **Padronizar breakpoints**
3. **Testar em diferentes dispositivos**

---

## PRÓXIMOS PASSOS

A análise do código fonte confirma os problemas identificados nos screenshots e revela questões técnicas adicionais. As recomendações específicas com código serão apresentadas na próxima seção.


---

## 9. RECOMENDAÇÕES ESPECÍFICAS COM CÓDIGO

### 9.1 Refatoração do Design System

#### **Problema:** Tokens não aplicados consistentemente
#### **Solução:** Criar utilitários Tailwind customizados

**Arquivo:** `src/styles/design-system.css`
```css
@layer utilities {
  /* Spacing System */
  .space-xs { @apply space-y-1; }
  .space-sm { @apply space-y-2; }
  .space-md { @apply space-y-4; }
  .space-lg { @apply space-y-6; }
  .space-xl { @apply space-y-8; }
  .space-2xl { @apply space-y-12; }

  .gap-xs { @apply gap-1; }
  .gap-sm { @apply gap-2; }
  .gap-md { @apply gap-4; }
  .gap-lg { @apply gap-6; }
  .gap-xl { @apply gap-8; }

  .p-xs { @apply p-1; }
  .p-sm { @apply p-2; }
  .p-md { @apply p-4; }
  .p-lg { @apply p-6; }
  .p-xl { @apply p-8; }

  /* Typography System */
  .text-display { @apply text-4xl font-bold tracking-tight; }
  .text-h1 { @apply text-3xl font-bold; }
  .text-h2 { @apply text-2xl font-semibold; }
  .text-h3 { @apply text-xl font-semibold; }
  .text-h4 { @apply text-lg font-medium; }
  .text-body { @apply text-base; }
  .text-caption { @apply text-sm text-muted-foreground; }

  /* Card System */
  .card-base {
    @apply rounded-lg border border-border bg-card shadow-sm;
  }
  
  .card-elevated {
    @apply card-base shadow-md hover:shadow-lg transition-shadow;
  }
  
  .card-interactive {
    @apply card-elevated hover:scale-[1.01] transition-transform cursor-pointer;
  }
}
```

#### **Refatoração do AppSidebar:**

**Arquivo:** `src/components/layout/AppSidebar.tsx` (versão simplificada)
```typescript
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { SidebarNavigation } from "./SidebarNavigation";
import { SidebarHeader } from "./SidebarHeader";

export function AppSidebar() {
  const { state } = useSidebar();
  const { profile } = useAuth();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r-0 bg-sidebar">
      <SidebarHeader collapsed={collapsed} />
      <SidebarNavigation 
        collapsed={collapsed} 
        userRole={profile?.role} 
      />
    </Sidebar>
  );
}
```

**Arquivo:** `src/components/layout/SidebarNavigation.tsx` (novo)
```typescript
import { useLocation } from "react-router-dom";
import { SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu } from "@/components/ui/sidebar";
import { NavigationSection } from "./NavigationSection";
import { NAVIGATION_CONFIG } from "@/config/navigation";

interface SidebarNavigationProps {
  collapsed: boolean;
  userRole?: string;
}

export function SidebarNavigation({ collapsed, userRole }: SidebarNavigationProps) {
  const location = useLocation();

  const visibleSections = NAVIGATION_CONFIG.filter(section => 
    !section.requiredRole || section.requiredRole === userRole
  );

  return (
    <SidebarContent className="space-md">
      {visibleSections.map((section) => (
        <SidebarGroup key={section.id}>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/70">
            {!collapsed ? section.label : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavigationSection
                items={section.items}
                collapsed={collapsed}
                currentPath={location.pathname}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </SidebarContent>
  );
}
```

**Arquivo:** `src/config/navigation.ts` (novo)
```typescript
import { 
  LayoutDashboard, Target, Store, FolderOpen, Package, 
  Calculator, BarChart3, Crown, Settings, Shield, Bot 
} from '@/components/ui/icons';

export const NAVIGATION_CONFIG = [
  {
    id: "main",
    label: "Principal",
    items: [
      { id: "dashboard", title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { id: "pricing", title: "Precificação", icon: Calculator, path: "/pricing" },
      { id: "strategy", title: "Estratégia", icon: Target, path: "/strategy" },
    ]
  },
  {
    id: "management",
    label: "Gestão",
    items: [
      { id: "products", title: "Produtos", icon: Package, path: "/products" },
      { id: "sales", title: "Vendas", icon: BarChart3, path: "/sales" },
      { id: "marketplaces", title: "Marketplaces", icon: Store, path: "/marketplaces" },
    ]
  },
  {
    id: "settings",
    label: "Configurações",
    items: [
      { id: "categories", title: "Categorias", icon: FolderOpen, path: "/categories" },
      { id: "settings", title: "Preferências", icon: Settings, path: "/settings" },
    ]
  },
  {
    id: "account",
    label: "Conta",
    items: [
      { id: "subscription", title: "Assinatura", icon: Crown, path: "/subscription" },
    ]
  },
  {
    id: "admin",
    label: "Administração",
    requiredRole: "super_admin",
    items: [
      { id: "admin", title: "Dashboard Admin", icon: Shield, path: "/admin" },
      { id: "assistants", title: "Assistentes IA", icon: Bot, path: "/admin/assistentes-ia" },
    ]
  }
];
```

### 9.2 Refatoração do DashboardForm

#### **Problema:** Componente muito complexo (400+ linhas)
#### **Solução:** Quebrar em componentes menores

**Arquivo:** `src/components/forms/DashboardForm.tsx` (refatorado)
```typescript
import { useState } from "react";
import { ProductSelector } from "./dashboard/ProductSelector";
import { MarketplaceSelector } from "./dashboard/MarketplaceSelector";
import { PricingResults } from "./dashboard/PricingResults";
import { DashboardActions } from "./dashboard/DashboardActions";
import { useDashboardData } from "@/hooks/useDashboardData";

export const DashboardForm = () => {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);
  
  const {
    products,
    marketplaces,
    pricingResults,
    isLoading,
    recalculate
  } = useDashboardData(selectedProductId, selectedMarketplaces);

  return (
    <div className="space-lg">
      <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
        <ProductSelector
          products={products}
          selectedProductId={selectedProductId}
          onProductChange={setSelectedProductId}
          isLoading={isLoading}
        />
        
        <MarketplaceSelector
          marketplaces={marketplaces}
          selectedMarketplaces={selectedMarketplaces}
          onMarketplacesChange={setSelectedMarketplaces}
          isLoading={isLoading}
        />
      </div>

      <DashboardActions
        onRecalculate={recalculate}
        disabled={!selectedProductId || selectedMarketplaces.length === 0}
        isLoading={isLoading}
      />

      <PricingResults
        results={pricingResults}
        isLoading={isLoading}
      />
    </div>
  );
};
```

**Arquivo:** `src/components/forms/dashboard/ProductSelector.tsx` (novo)
```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Package } from "@/components/ui/icons";
import { BaseCard } from "@/components/ui";

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface ProductSelectorProps {
  products: Product[];
  selectedProductId: string;
  onProductChange: (productId: string) => void;
  isLoading: boolean;
}

export function ProductSelector({ 
  products, 
  selectedProductId, 
  onProductChange, 
  isLoading 
}: ProductSelectorProps) {
  return (
    <BaseCard
      icon={<Package className="size-5 text-primary" />}
      title={<span className="text-h4">Seleção de Produto</span>}
      className="card-base"
      contentPadding="p-md"
    >
      <div className="space-sm">
        <Label htmlFor="product-select" className="text-body font-medium">
          Produto *
        </Label>
        <Select
          value={selectedProductId}
          onValueChange={onProductChange}
          disabled={isLoading}
        >
          <SelectTrigger id="product-select" className="h-11">
            <SelectValue placeholder="Selecione um produto" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{product.name}</span>
                  <span className="text-caption">SKU: {product.sku}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-caption">
          Selecione um produto para comparar preços entre marketplaces
        </p>
      </div>
    </BaseCard>
  );
}
```

**Arquivo:** `src/components/forms/dashboard/MarketplaceSelector.tsx` (novo)
```typescript
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Store } from "@/components/ui/icons";
import { BaseCard } from "@/components/ui";
import { Badge } from "@/components/ui/badge";

interface Marketplace {
  id: string;
  name: string;
}

interface MarketplaceSelectorProps {
  marketplaces: Marketplace[];
  selectedMarketplaces: string[];
  onMarketplacesChange: (marketplaces: string[]) => void;
  isLoading: boolean;
}

export function MarketplaceSelector({
  marketplaces,
  selectedMarketplaces,
  onMarketplacesChange,
  isLoading
}: MarketplaceSelectorProps) {
  const handleMarketplaceToggle = (marketplaceId: string) => {
    const newSelection = selectedMarketplaces.includes(marketplaceId)
      ? selectedMarketplaces.filter(id => id !== marketplaceId)
      : [...selectedMarketplaces, marketplaceId];
    
    onMarketplacesChange(newSelection);
  };

  return (
    <BaseCard
      icon={<Store className="size-5 text-primary" />}
      title={
        <div className="flex items-center gap-2">
          <span className="text-h4">Marketplaces</span>
          <Badge variant="secondary">
            {selectedMarketplaces.length}/6
          </Badge>
        </div>
      }
      className="card-base"
      contentPadding="p-md"
    >
      <div className="space-sm">
        <Label className="text-body font-medium">
          Selecione até 6 marketplaces para comparação
        </Label>
        <div className="grid grid-cols-1 gap-3">
          {marketplaces.map((marketplace) => (
            <div key={marketplace.id} className="flex items-center space-x-2">
              <Checkbox
                id={marketplace.id}
                checked={selectedMarketplaces.includes(marketplace.id)}
                onCheckedChange={() => handleMarketplaceToggle(marketplace.id)}
                disabled={
                  isLoading || 
                  (!selectedMarketplaces.includes(marketplace.id) && selectedMarketplaces.length >= 6)
                }
              />
              <Label
                htmlFor={marketplace.id}
                className="text-body cursor-pointer"
              >
                {marketplace.name}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </BaseCard>
  );
}
```

### 9.3 Sistema de Cards Padronizado

#### **Problema:** Cards com estilos inconsistentes
#### **Solução:** Criar variantes padronizadas

**Arquivo:** `src/components/ui/card-variants.tsx` (novo)
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend = "neutral",
  className 
}: MetricCardProps) {
  const trendColors = {
    up: "text-success",
    down: "text-destructive", 
    neutral: "text-muted-foreground"
  };

  return (
    <Card className={cn("card-base", className)}>
      <CardHeader className="flex flex-row items-center justify-between p-md">
        <CardTitle className="text-h4 font-medium">{title}</CardTitle>
        {icon && <div className="text-primary">{icon}</div>}
      </CardHeader>
      <CardContent className="p-md pt-0">
        <div className="space-xs">
          <div className={cn("text-2xl font-bold", trendColors[trend])}>
            {value}
          </div>
          {subtitle && (
            <p className="text-caption">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ComparisonCardProps {
  title: string;
  current: number;
  suggested: number;
  format?: "currency" | "percentage";
  rank?: number;
  className?: string;
}

export function ComparisonCard({
  title,
  current,
  suggested,
  format = "currency",
  rank,
  className
}: ComparisonCardProps) {
  const formatValue = (value: number) => {
    if (format === "currency") {
      return `R$ ${value.toFixed(2)}`;
    }
    return `${value.toFixed(1)}%`;
  };

  const isImprovement = suggested > current;

  return (
    <Card className={cn("card-interactive", className)}>
      {rank === 1 && (
        <Badge className="absolute -right-2 -top-2 bg-success">
          🏆 Melhor
        </Badge>
      )}
      
      <CardHeader className="p-md">
        <CardTitle className="text-h4">{title}</CardTitle>
      </CardHeader>
      
      <CardContent className="p-md pt-0 space-md">
        <div className="grid grid-cols-2 gap-md">
          <div className="space-xs">
            <p className="text-caption">Atual</p>
            <p className="text-xl font-semibold">{formatValue(current)}</p>
          </div>
          <div className="space-xs">
            <p className="text-caption">Sugerido</p>
            <p className={cn(
              "text-xl font-bold",
              isImprovement ? "text-success" : "text-warning"
            )}>
              {formatValue(suggested)}
            </p>
          </div>
        </div>
        
        <div className="border-t border-border pt-md">
          <div className={cn(
            "text-sm font-medium",
            isImprovement ? "text-success" : "text-warning"
          )}>
            {isImprovement ? "↗" : "↘"} 
            {format === "currency" 
              ? `R$ ${Math.abs(suggested - current).toFixed(2)}`
              : `${Math.abs(suggested - current).toFixed(1)}%`
            } de diferença
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 9.4 Hook Customizado para Dashboard

#### **Problema:** Lógica complexa misturada com UI
#### **Solução:** Extrair para hook customizado

**Arquivo:** `src/hooks/useDashboardData.ts` (novo)
```typescript
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCalculatePrice, useSavePricing } from "@/hooks/usePricing";
import { useToast } from "@/components/ui/use-toast";

export function useDashboardData(productId: string, marketplaceIds: string[]) {
  const { toast } = useToast();
  const [isRecalculating, setIsRecalculating] = useState(false);
  
  const calculatePrice = useCalculatePrice();
  const savePricing = useSavePricing();

  // Fetch products
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch marketplaces
  const { data: marketplaces = [], isLoading: loadingMarketplaces } = useQuery({
    queryKey: ["marketplaces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplaces")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch pricing results
  const { data: pricingResults = [], isLoading: loadingResults, refetch } = useQuery({
    queryKey: ["pricing-results", productId, marketplaceIds],
    queryFn: async () => {
      if (!productId || marketplaceIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("saved_pricing")
        .select(`
          *,
          products!saved_pricing_product_id_fkey(name, sku),
          marketplaces!saved_pricing_marketplace_id_fkey(name)
        `)
        .eq("product_id", productId)
        .in("marketplace_id", marketplaceIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId && marketplaceIds.length > 0,
  });

  const recalculate = useCallback(async () => {
    if (!productId || marketplaceIds.length === 0) return;

    setIsRecalculating(true);
    
    try {
      const promises = marketplaceIds.map(async (marketplaceId) => {
        const result = await calculatePrice.mutateAsync({
          productId,
          marketplaceId,
          taxaCartao: 3.5,
          provisaoDesconto: 5,
          margemDesejada: 25,
        });

        if (result) {
          await savePricing.mutateAsync({
            product_id: productId,
            marketplace_id: marketplaceId,
            ...result,
          });
        }
      });

      await Promise.all(promises);
      await refetch();
      
      toast({
        title: "Sucesso",
        description: "Preços recalculados com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao recalcular preços",
        variant: "destructive",
      });
    } finally {
      setIsRecalculating(false);
    }
  }, [productId, marketplaceIds, calculatePrice, savePricing, refetch, toast]);

  return {
    products,
    marketplaces,
    pricingResults,
    isLoading: loadingProducts || loadingMarketplaces || loadingResults || isRecalculating,
    recalculate,
  };
}
```

### 9.5 Configuração de Responsividade Melhorada

#### **Problema:** Breakpoints inconsistentes
#### **Solução:** Padronizar sistema responsivo

**Arquivo:** `tailwind.config.ts` (atualização)
```typescript
export default {
  // ... configuração existente
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      // ... resto da configuração
    }
  }
} satisfies Config;
```

**Arquivo:** `src/components/layout/ResponsiveGrid.tsx` (novo)
```typescript
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ResponsiveGridProps {
  children: ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: "sm" | "md" | "lg";
  className?: string;
}

export function ResponsiveGrid({ 
  children, 
  cols = { default: 1, md: 2, lg: 3 },
  gap = "md",
  className 
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: "gap-2",
    md: "gap-4", 
    lg: "gap-6"
  };

  const gridClasses = cn(
    "grid",
    gapClasses[gap],
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}
```

---

## 10. PLANO DE IMPLEMENTAÇÃO DETALHADO

### **Semana 1-2: Design System**
1. ✅ Implementar utilitários CSS customizados
2. ✅ Refatorar sistema de cores
3. ✅ Padronizar componentes base
4. ✅ Criar documentação de componentes

### **Semana 3-4: Refatoração de Componentes**
1. ✅ Quebrar DashboardForm em componentes menores
2. ✅ Simplificar AppSidebar
3. ✅ Criar sistema de cards padronizado
4. ✅ Implementar hooks customizados

### **Semana 5: Performance e Responsividade**
1. ✅ Otimizar re-renders com React.memo
2. ✅ Implementar lazy loading
3. ✅ Padronizar sistema responsivo
4. ✅ Testar em diferentes dispositivos

### **Semana 6: Testes e Refinamentos**
1. ✅ Testes de componentes
2. ✅ Testes de acessibilidade
3. ✅ Ajustes finais de design
4. ✅ Documentação final

---

## 11. MÉTRICAS DE SUCESSO

### **Técnicas:**
- ✅ Redução de 60% no tamanho dos componentes principais
- ✅ Melhoria de 40% na performance de renderização
- ✅ 100% de consistência no design system
- ✅ Cobertura de testes > 80%

### **UX/UI:**
- ✅ Redução de 50% no tempo para completar tarefas
- ✅ Melhoria na pontuação de acessibilidade (WCAG AA)
- ✅ Interface responsiva em todos os dispositivos
- ✅ Feedback positivo dos usuários

### **Manutenibilidade:**
- ✅ Redução de 70% na duplicação de código
- ✅ Documentação completa de componentes
- ✅ Padrões de código consistentes
- ✅ Facilidade para novos desenvolvedores

---

## CONCLUSÃO

A análise profunda do código fonte revelou uma aplicação com base técnica sólida, mas que necessita de refatoração significativa para atingir padrões modernos de UX/UI e manutenibilidade. As recomendações apresentadas, quando implementadas, transformarão a aplicação em uma ferramenta profissional, escalável e user-friendly.

**Investimento estimado:** 6 semanas de desenvolvimento
**ROI esperado:** Melhoria significativa na satisfação do usuário, redução de bugs e facilidade de manutenção

