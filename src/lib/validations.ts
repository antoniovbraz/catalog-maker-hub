import { z } from "zod";
import { VALIDATION_CONFIG } from "./config";

/**
 * Schemas de validação centralizados com Zod
 */

// Schema base para entidades
export const baseEntitySchema = z.object({
  id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Validações comuns
export const commonValidations = {
  name: z.string()
    .min(VALIDATION_CONFIG.MIN_NAME_LENGTH, "Nome é obrigatório")
    .max(VALIDATION_CONFIG.MAX_NAME_LENGTH, `Nome deve ter no máximo ${VALIDATION_CONFIG.MAX_NAME_LENGTH} caracteres`),
  
  description: z.string()
    .max(VALIDATION_CONFIG.MAX_DESCRIPTION_LENGTH, `Descrição deve ter no máximo ${VALIDATION_CONFIG.MAX_DESCRIPTION_LENGTH} caracteres`)
    .optional(),
  
  sku: z.string()
    .max(VALIDATION_CONFIG.MAX_SKU_LENGTH, `SKU deve ter no máximo ${VALIDATION_CONFIG.MAX_SKU_LENGTH} caracteres`)
    .optional(),
  
  price: z.number()
    .min(VALIDATION_CONFIG.MIN_PRICE, `Preço deve ser maior que ${VALIDATION_CONFIG.MIN_PRICE}`)
    .max(VALIDATION_CONFIG.MAX_PRICE, `Preço deve ser menor que ${VALIDATION_CONFIG.MAX_PRICE}`),
  
  percentage: z.number()
    .min(0, "Percentual deve ser positivo")
    .max(100, "Percentual não pode exceder 100%"),
  
  positiveNumber: z.number()
    .min(0, "Valor deve ser positivo"),
  
  url: z.string()
    .url("URL deve ser válida")
    .optional()
    .or(z.literal("")),
};

// Schema de categoria
export const categorySchema = z.object({
  name: commonValidations.name,
  description: commonValidations.description,
});

// Schema de marketplace
export const marketplaceSchema = z.object({
  name: commonValidations.name,
  description: commonValidations.description,
  url: commonValidations.url,
});

// Schema de produto
export const productSchema = z.object({
  name: commonValidations.name,
  sku: commonValidations.sku,
  description: commonValidations.description,
  category_id: z.string().optional(),
  cost_unit: commonValidations.positiveNumber,
  packaging_cost: commonValidations.positiveNumber.default(0),
  tax_rate: commonValidations.percentage.default(0),
});

// Schema de comissão
export const commissionSchema = z.object({
  marketplace_id: z.string().min(1, "Marketplace é obrigatório"),
  category_id: z.string().optional(),
  rate: z.number()
    .min(0, "Taxa deve ser positiva")
    .max(1, "Taxa deve ser entre 0 e 1"),
});

// Schema de regra de taxa fixa
export const fixedFeeRuleSchema = z.object({
  marketplace_id: z.string().min(1, "Marketplace é obrigatório"),
  rule_type: z.enum(["constante", "faixa"]),
  value: commonValidations.positiveNumber,
  range_min: commonValidations.positiveNumber.optional(),
  range_max: commonValidations.positiveNumber.optional(),
});

// Schema de regra de frete
export const shippingRuleSchema = z.object({
  marketplace_id: z.string().min(1, "Marketplace é obrigatório"),
  product_id: z.string().optional(),
  shipping_cost: commonValidations.positiveNumber,
});

// Schema de venda
export const saleSchema = z.object({
  product_id: z.string().min(1, "Produto é obrigatório"),
  marketplace_id: z.string().min(1, "Marketplace é obrigatório"),
  price_charged: commonValidations.price,
  quantity: z.number().int().min(1, "Quantidade deve ser pelo menos 1"),
  sold_at: z.string().min(1, "Data da venda é obrigatória"),
});

// Schema de precificação
export const pricingCalculationSchema = z.object({
  product_id: z.string().min(1, "Produto é obrigatório"),
  marketplace_id: z.string().min(1, "Marketplace é obrigatório"),
  taxa_cartao: commonValidations.percentage,
  provisao_desconto: commonValidations.percentage,
  margem_desejada: commonValidations.percentage,
});

// Schema de precificação salva
export const savedPricingSchema = z.object({
  product_id: z.string().min(1, "Produto é obrigatório"),
  marketplace_id: z.string().min(1, "Marketplace é obrigatório"),
  taxa_cartao: commonValidations.percentage,
  provisao_desconto: commonValidations.percentage,
  margem_desejada: commonValidations.percentage,
  preco_sugerido: commonValidations.price,
  margem_unitaria: z.number(),
  margem_percentual: commonValidations.percentage,
});

// Types inferidos dos schemas
export type CategoryFormData = z.infer<typeof categorySchema>;
export type MarketplaceFormData = z.infer<typeof marketplaceSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type CommissionFormData = z.infer<typeof commissionSchema>;
export type FixedFeeRuleFormData = z.infer<typeof fixedFeeRuleSchema>;
export type ShippingRuleFormData = z.infer<typeof shippingRuleSchema>;
export type SaleFormData = z.infer<typeof saleSchema>;
export type PricingCalculationData = z.infer<typeof pricingCalculationSchema>;
export type SavedPricingFormData = z.infer<typeof savedPricingSchema>;