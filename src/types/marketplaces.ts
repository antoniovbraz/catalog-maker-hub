import { z } from "zod";
import { Json } from "@/integrations/supabase/types";

export interface MarketplaceType {
  id: string;
  name: string;
  description?: string;
  url?: string;
  parent_marketplace_id?: string | null;
  marketplace_metadata?: Json;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceWithChildren extends MarketplaceType {
  children?: MarketplaceType[];
}

export interface MarketplaceHierarchy {
  parent: MarketplaceType;
  children: MarketplaceType[];
}

export const marketplaceSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  url: z.string().url("URL deve ser válida").optional().or(z.literal("")),
  parent_marketplace_id: z.string().uuid().optional().nullable(),
  marketplace_metadata: z.record(z.any()).optional(),
});

export type MarketplaceFormData = z.infer<typeof marketplaceSchema>;