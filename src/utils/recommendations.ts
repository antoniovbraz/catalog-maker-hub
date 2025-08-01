import { PricingComparison, BulkPricingResult } from "@/hooks/useBulkPricing";
import { formatarMoeda, formatarPercentual } from "./pricing";

export interface Recommendation {
  id: string;
  type: 'optimization' | 'alert' | 'opportunity';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  productId?: string;
  marketplaceId?: string;
  suggestedAction: string;
  potentialGain?: number;
}

export function generateRecommendations(
  comparisons: PricingComparison[],
  bulkResults: BulkPricingResult[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // 1. Produtos com margens baixas
  const lowMarginProducts = comparisons.filter(
    comp => comp.melhorMarketplace.margemPercentual < 10
  );

  lowMarginProducts.forEach(product => {
    recommendations.push({
      id: `low-margin-${product.productId}`,
      type: 'alert',
      title: 'Margem Baixa Detectada',
      description: `O produto "${product.productName}" tem margem de apenas ${formatarPercentual(product.melhorMarketplace.margemPercentual)} no melhor marketplace.`,
      impact: 'high',
      productId: product.productId,
      suggestedAction: 'Revisar custos ou aumentar preço de venda',
    });
  });

  // 2. Oportunidades de marketplace
  comparisons.forEach(product => {
    if (product.marketplaces.length > 1) {
      const marketplacesSorted = [...product.marketplaces].sort(
        (a, b) => b.margemPercentual - a.margemPercentual
      );
      
      const melhor = marketplacesSorted[0];
      const pior = marketplacesSorted[marketplacesSorted.length - 1];
      
      if (melhor.margemPercentual - pior.margemPercentual > 5) {
        const gainPotential = (melhor.margemPercentual - pior.margemPercentual) * pior.precoSugerido / 100;
        
        recommendations.push({
          id: `marketplace-opportunity-${product.productId}`,
          type: 'opportunity',
          title: 'Oportunidade de Marketplace',
          description: `"${product.productName}" tem ${formatarPercentual(melhor.margemPercentual - pior.margemPercentual)} mais margem no ${melhor.name} vs ${pior.name}.`,
          impact: gainPotential > 50 ? 'high' : gainPotential > 20 ? 'medium' : 'low',
          productId: product.productId,
          marketplaceId: melhor.id,
          suggestedAction: `Focar vendas no ${melhor.name}`,
          potentialGain: gainPotential,
        });
      }
    }
  });

  // 3. Produtos sem precificação
  const productsWithErrors = bulkResults.filter(result => result.hasError);
  const uniqueErrorProducts = Array.from(
    new Set(productsWithErrors.map(p => p.productId))
  );

  uniqueErrorProducts.forEach(productId => {
    const errorProduct = productsWithErrors.find(p => p.productId === productId);
    if (errorProduct) {
      recommendations.push({
        id: `missing-data-${productId}`,
        type: 'alert',
        title: 'Dados Incompletos',
        description: `"${errorProduct.productName}" não pode ser precificado corretamente.`,
        impact: 'medium',
        productId,
        suggestedAction: 'Verificar custos, comissões e configurações',
      });
    }
  });

  // 4. Análise de performance geral
  const allMargins = bulkResults
    .filter(r => !r.hasError)
    .map(r => r.margemPercentual);
  
  if (allMargins.length > 0) {
    const avgMargin = allMargins.reduce((sum, margin) => sum + margin, 0) / allMargins.length;
    
    if (avgMargin < 15) {
      recommendations.push({
        id: 'general-margin-alert',
        type: 'alert',
        title: 'Margem Geral Baixa',
        description: `A margem média do portfólio é de ${formatarPercentual(avgMargin)}, abaixo do recomendado (20%+).`,
        impact: 'high',
        suggestedAction: 'Revisar estratégia de precificação geral',
      });
    }
  }

  // 5. Top performers
  const topProducts = comparisons
    .filter(p => p.melhorMarketplace.margemPercentual > 25)
    .sort((a, b) => b.melhorMarketplace.margemPercentual - a.melhorMarketplace.margemPercentual)
    .slice(0, 3);

  if (topProducts.length > 0) {
    recommendations.push({
      id: 'top-performers',
      type: 'opportunity',
      title: 'Produtos de Alta Performance',
      description: `${topProducts.length} produtos têm margens excelentes (25%+). Considere aumentar o foco nestes produtos.`,
      impact: 'medium',
      suggestedAction: 'Aumentar investimento em marketing e estoque',
    });
  }

  return recommendations.sort((a, b) => {
    const impactOrder = { high: 3, medium: 2, low: 1 };
    return impactOrder[b.impact] - impactOrder[a.impact];
  });
}

export function getRecommendationIcon(type: Recommendation['type']): string {
  switch (type) {
    case 'optimization':
      return '🎯';
    case 'alert':
      return '⚠️';
    case 'opportunity':
      return '💡';
    default:
      return '📊';
  }
}

export function getImpactColor(impact: Recommendation['impact']): string {
  switch (impact) {
    case 'high':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}