import { z } from "zod";
export type { SavedPricingRow } from "@/integrations/supabase/types";

export interface SavedPricingType {
  id: string;
  product_id: string;
  marketplace_id: string;
  custo_total: number;
  valor_fixo: number;
  frete: number;
  comissao: number;
  taxa_cartao: number;
  provisao_desconto: number;
  margem_desejada: number;
  preco_sugerido: number;
  preco_praticado: number | null;
  margem_unitaria: number;
  margem_percentual: number;
  created_at: string;
  updated_at: string;
}

export interface PricingCalculationParams {
  productId: string;
  marketplaceId: string;
  taxaCartao: number;
  provisaoDesconto: number;
  margemDesejada: number;
}

export interface MargemRealParams {
  productId: string;
  marketplaceId: string;
  taxaCartao: number;
  provisaoDesconto: number;
  precoPraticado: number;
}

export const pricingSchema = z.object({
  product_id: z.string().min(1, "Produto é obrigatório"),
  marketplace_id: z.string().min(1, "Marketplace é obrigatório"),
  custo_total: z.number().min(0, "Custo total deve ser positivo"),
  valor_fixo: z.number().min(0, "Valor fixo deve ser positivo").default(0),
  frete: z.number().min(0, "Frete deve ser positivo").default(0),
  comissao: z.number().min(0, "Comissão deve ser positiva").max(100, "Comissão não pode exceder 100%").default(0),
  taxa_cartao: z.number().min(0, "Taxa do cartão deve ser positiva").max(100, "Taxa não pode exceder 100%").default(0),
  provisao_desconto: z.number().min(0, "Provisão de desconto deve ser positiva").max(100, "Provisão não pode exceder 100%").default(0),
  margem_desejada: z.number().min(0, "Margem desejada deve ser positiva").max(100, "Margem não pode exceder 100%").default(0),
  preco_praticado: z
    .number()
    .min(0, "Preço praticado deve ser positivo")
    .nullable()
    .default(null),
});

export type PricingFormData = z.infer<typeof pricingSchema>;