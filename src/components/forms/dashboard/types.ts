export interface PricingResult {
  marketplace_id: string;
  marketplace_name: string;
  custo_total: number;
  valor_fixo: number;
  frete: number;
  comissao: number;
  preco_sugerido: number;
  margem_unitaria: number;
  margem_percentual: number;
  preco_praticado: number;
  taxa_cartao: number;
  provisao_desconto: number;
  margem_desejada: number;
  product_name: string;
  product_sku: string;
}

export type SortOption = "margem_percentual" | "margem_unitaria" | "preco_sugerido";
