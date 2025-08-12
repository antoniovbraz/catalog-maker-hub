import { z } from "zod";
import type {
  SavedPricingRow as SupabaseSavedPricingRow,
} from "@/integrations/supabase/types";

/**
 * Alias para a linha de `saved_pricing` gerada pelo Supabase.
 * Centralizar este tipo evita divergências com o schema do banco.
 */
export type SavedPricingRow = SupabaseSavedPricingRow;

/** Linha de precificação acompanhada do nome do marketplace (join). */
export type SavedPricingWithMarketplace = SavedPricingRow & {
  marketplace_name: string;
};

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