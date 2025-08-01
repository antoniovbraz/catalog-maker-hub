import { z } from "zod";

export interface MarketplaceType {
  id: string;
  name: string;
  description?: string;
  url?: string;
  created_at: string;
  updated_at: string;
}

export const marketplaceSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  url: z.string().url("URL deve ser válida").optional().or(z.literal("")),
});

export type MarketplaceFormData = z.infer<typeof marketplaceSchema>;