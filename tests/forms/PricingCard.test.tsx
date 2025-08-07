import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PricingCard } from '@/components/forms/dashboard/PricingCard';
import type { PricingResult } from '@/components/forms/dashboard/types';

describe('PricingCard', () => {
  it('renderiza informações básicas', () => {
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    (global as any).ResizeObserver = ResizeObserver;
    const result: PricingResult = {
      marketplace_id: '1',
      marketplace_name: 'Marketplace Teste',
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

    render(
      <TooltipProvider>
        <DndContext>
          <SortableContext items={[result.marketplace_id]} strategy={verticalListSortingStrategy}>
            <PricingCard result={result} index={0} />
          </SortableContext>
        </DndContext>
      </TooltipProvider>
    );

    expect(screen.getByText('Marketplace Teste')).toBeInTheDocument();
    expect(screen.getByText('Margem R$')).toBeInTheDocument();
  });
});
