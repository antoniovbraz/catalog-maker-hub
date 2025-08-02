import { z } from "zod";

export interface CommissionType {
  id: string;
  marketplace_id: string;
  category_id: string | null;
  rate: number;
  created_at: string;
  updated_at: string;
}

export interface CommissionWithDetails extends CommissionType {
  marketplaces: {
    id: string;
    name: string;
  } | null;
  categories: {
    id: string;
    name: string;
  } | null;
}

export const commissionSchema = z.object({
  marketplace_id: z.string().min(1, "Marketplace é obrigatório"),
  category_id: z.string().optional().nullable(),
  rate: z.number()
    .min(0, "Taxa deve ser positiva")
    .max(100, "Taxa não pode exceder 100%"),
});

export type CommissionFormData = z.infer<typeof commissionSchema>;

export interface CommissionCalculationParams {
  marketplaceId: string;
  categoryId?: string | null;
}

export interface CommissionRule {
  id: string;
  marketplace_id: string;
  category_id: string | null;
  rate: number;
  is_default: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}