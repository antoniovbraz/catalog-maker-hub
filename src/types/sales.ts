import { z } from "zod";

export interface SaleType {
  id: string;
  product_id: string;
  marketplace_id: string;
  price_charged: number;
  quantity: number;
  sold_at: string;
}

export interface SaleWithDetails extends SaleType {
  products: {
    id: string;
    name: string;
    sku?: string;
  } | null;
  marketplaces: {
    id: string;
    name: string;
  } | null;
}

export const saleSchema = z.object({
  product_id: z.string().min(1, "Produto é obrigatório"),
  marketplace_id: z.string().min(1, "Marketplace é obrigatório"),
  price_charged: z.number().min(0.01, "Preço deve ser maior que zero"),
  quantity: z.number().int().min(1, "Quantidade deve ser pelo menos 1"),
  sold_at: z.string().min(1, "Data da venda é obrigatória"),
});

export type SaleFormData = z.infer<typeof saleSchema>;