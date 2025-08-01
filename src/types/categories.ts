import { z } from "zod";

export interface CategoryType {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;