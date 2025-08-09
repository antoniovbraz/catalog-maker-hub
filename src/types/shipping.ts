import { z } from "zod";
import { shippingRuleSchema } from "@/lib/validations";

export interface ShippingRuleType {
  id: string;
  product_id: string | null;
  marketplace_id: string;
  shipping_cost: number;
  free_shipping_threshold: number | null;
  created_at: string;
  updated_at: string;
  products?: {
    id: string;
    name: string;
  } | null;
  marketplaces?: {
    id: string;
    name: string;
  } | null;
}

export type ShippingRuleFormData = z.infer<typeof shippingRuleSchema>;
