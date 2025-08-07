import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DragList } from '@/components/forms/dashboard/DragList';
import type { PricingResult } from '@/components/forms/dashboard/types';
import { TooltipProvider } from '@/components/ui/tooltip';

describe('DragList', () => {
  it('renderiza cards de precificação', () => {
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    (global as any).ResizeObserver = ResizeObserver;
    const base: Omit<PricingResult, 'marketplace_id' | 'marketplace_name'> = {
      custo_total: 100,
      valor_fixo: 10,
      frete: 5,
      comissao: 2,
      preco_sugerido: 150,
      margem_unitaria: 40,
      margem_percentual: 20,
      preco_praticado: 150,
      taxa_cartao: 2,
      provisao_desconto: 1,
      margem_desejada: 25,
      product_name: 'Prod',
      product_sku: 'SKU',
    };

    const results: PricingResult[] = [
      { ...base, marketplace_id: '1', marketplace_name: 'Marketplace A' },
      { ...base, marketplace_id: '2', marketplace_name: 'Marketplace B' },
    ];

    const cardOrder = results.map(r => r.marketplace_id);
    const handleDragEnd = () => {};

    render(
      <TooltipProvider>
        <DragList results={results} cardOrder={cardOrder} onDragEnd={handleDragEnd} />
      </TooltipProvider>
    );

    expect(screen.getByText('Marketplace A')).toBeInTheDocument();
    expect(screen.getByText('Marketplace B')).toBeInTheDocument();
  });
});
