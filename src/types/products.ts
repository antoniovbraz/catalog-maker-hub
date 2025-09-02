import { z } from "zod";

export interface ProductType {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  category_id?: string;
  cost_unit: number;
  packaging_cost: number;
  tax_rate: number;
  source: 'manual' | 'mercado_livre' | 'shopee';
  created_at: string;
  updated_at: string;
  // Novos campos ML
  ml_stock_quantity?: number;
  ml_attributes?: unknown;
  dimensions?: unknown;
  weight?: number;
  warranty?: string;
  brand?: string;
  model?: string;
  ml_seller_sku?: string;
  ml_available_quantity?: number;
  ml_sold_quantity?: number;
  ml_variation_id?: string;
  ml_variations?: unknown[];
  ml_pictures?: unknown[];
}

export interface ProductWithCategory extends ProductType {
  categories: {
    id: string;
    name: string;
  } | null;
}

export const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  sku: z.string().optional(),
  description: z.string().optional(),
  category_id: z.string().optional(),
  cost_unit: z.number().min(0, "Custo unitário deve ser positivo"),
  packaging_cost: z.number().min(0, "Custo de embalagem deve ser positivo").default(0),
  tax_rate: z.number().min(0, "Taxa de imposto deve ser positiva").max(100, "Taxa não pode exceder 100%").default(0),
  source: z.enum(['manual', 'mercado_livre', 'shopee']).default('manual'),
});

export type ProductFormData = z.infer<typeof productSchema>;