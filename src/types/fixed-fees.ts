import { z } from "zod";

export interface FixedFeeRule {
  id: string;
  marketplace_id: string;
  rule_type: string;
  range_min: number | null;
  range_max: number | null;
  value: number;
  created_at: string;
  updated_at: string;
  marketplaces?: {
    name: string;
  };
}

export const fixedFeeRuleSchema = z.object({
  marketplace_id: z.string(),
  rule_type: z.string(),
  range_min: z.number().nullable(),
  range_max: z.number().nullable(),
  value: z.number(),
});

export type FixedFeeRuleFormData = z.infer<typeof fixedFeeRuleSchema>;
