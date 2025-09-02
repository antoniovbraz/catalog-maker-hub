import { z } from "zod";

export const featureFlagsSchema = z.object({
  auto_sync: z.boolean().optional(),
  batch_sync: z.boolean().optional(),
  webhook_processing: z.boolean().optional(),
}).catchall(z.boolean());

const rateLimitsSchema = z.object({
  sync_product: z.number().optional(),
  sync_order: z.number().optional(),
  token_refresh: z.number().optional(),
  default: z.number(),
});

export const mlAdvancedSettingsSchema = z.object({
  id: z.string(),
  tenant_id: z.string(),
  feature_flags: featureFlagsSchema,
  rate_limits: rateLimitsSchema,
  backup_schedule: z.string(),
  auto_recovery_enabled: z.boolean(),
  advanced_monitoring: z.boolean(),
  multi_account_enabled: z.boolean(),
  security_level: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type MLAdvancedSettings = z.infer<typeof mlAdvancedSettingsSchema>;
