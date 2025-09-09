import { z } from 'zod';

export const mlSyncProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string().optional(),
  description: z.string().optional(),
  cost_unit: z.number().optional(),
  image_url: z.string().optional(),
  ml_item_id: z.string().nullable().optional(),
  ml_permalink: z.string().nullable().optional(),
  ml_price: z.number().optional(),
  sync_status: z.enum(['pending', 'syncing', 'synced', 'error', 'not_synced']),
  last_sync: z.string().nullable().optional(),
  last_sync_at: z.string().nullable().optional(),
  error_message: z.string().nullable().optional(),
});

export const mlSyncStatusResponseSchema = z.object({
  total_products: z.number().default(0),
  synced_products: z.number().default(0),
  pending_products: z.number().default(0),
  error_products: z.number().default(0),
  last_sync: z.string().nullable().default(null),
  successful_24h: z.number().default(0),
  failed_24h: z.number().default(0),
  total_24h: z.number().default(0),
  health_status: z.string().default('unknown'),
  products: z.array(mlSyncProductSchema).optional(),
});

export const mlProductsResponseSchema = z.object({
  products: z.array(mlSyncProductSchema).default([]),
});

export const mlBatchSyncResultSchema = z.object({
  successful: z.number(),
  failed: z.number(),
});

export const mlImportResultSchema = z.object({
  created: z.number().default(0),
  updated: z.number().default(0),
});

export type MLSyncProduct = z.infer<typeof mlSyncProductSchema>;
export type MLBatchSyncResult = z.infer<typeof mlBatchSyncResultSchema>;
export type MLImportResult = z.infer<typeof mlImportResultSchema>;
