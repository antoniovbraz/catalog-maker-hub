import { z } from "zod";

export type MarketplaceDestination = 'mercado_livre' | 'shopee' | 'instagram';

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  image_type: 'product' | 'package' | 'specification' | 'detail';
  sort_order: number;
  created_at: string;
  updated_at: string;
  tenant_id: string;
}

export interface AdGenerationRequest {
  product_id: string;
  marketplace: MarketplaceDestination;
  image_urls: string[];
  custom_prompt?: string;
}

export interface AdGenerationResult {
  title: string;
  description: string;
  keywords: string[];
  marketplace_specific_data?: Record<string, any>;
}

export const productImageSchema = z.object({
  product_id: z.string().uuid("Product ID deve ser um UUID válido"),
  image_type: z.enum(['product', 'package', 'specification', 'detail']).default('product'),
  sort_order: z.number().min(0).default(0),
});

export type ProductImageFormData = z.infer<typeof productImageSchema>;

export const adGenerationSchema = z.object({
  product_id: z.string().uuid("Product ID deve ser um UUID válido"),
  marketplace: z.enum(['mercado_livre', 'shopee', 'instagram']),
  image_urls: z.array(z.string().url()).min(1, "Pelo menos uma imagem é obrigatória"),
  custom_prompt: z.string().optional(),
});

export type AdGenerationFormData = z.infer<typeof adGenerationSchema>;