import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

export const generateAdSchema = z.object({
  assistant_id: z.string(),
  product_info: z.string(),
  marketplace: z.string(),
  image_urls: z.array(z.string()),
  custom_prompt: z.string().optional(),
  description_only: z.boolean().optional(),
});

export const generateAdChatSchema = z.object({
  thread_id: z.string().optional(),
  message: z.string(),
  product_info: z.record(z.unknown()).optional(),
  marketplace: z.string(),
  is_initial_message: z.boolean().optional(),
});

export const assistantCreateSchema = z.object({
  name: z.string(),
  marketplace: z.string(),
  model: z.string(),
  instructions: z.string(),
  tenant_id: z.string(),
});

export const assistantUpdateSchema = z.object({
  name: z.string().optional(),
  model: z.string().optional(),
  instructions: z.string().optional(),
});

export const mlAuthSchema = z.object({
  action: z
    .enum(['start_auth', 'handle_callback', 'refresh_token', 'get_status'])
    .default('get_status'),
  code: z.string().optional(),
  state: z.string().optional(),
  tenant_id: z.string().optional(),
});

export const mlSyncRequestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('get_status') }),
  z.object({
    action: z.literal('sync_product'),
    product_id: z.string(),
    force_update: z.boolean().optional(),
  }),
  z.object({
    action: z.literal('sync_batch'),
    product_ids: z.array(z.string()),
    force_update: z.boolean().optional(),
  }),
  z.object({ action: z.literal('import_from_ml') }),
  z.object({
    action: z.literal('link_product'),
    product_id: z.string(),
    ml_item_id: z.string(),
  }),
  z.object({ action: z.literal('get_products') }),
  z.object({
    action: z.literal('create_ad'),
    ad_data: z.record(z.unknown()),
  }),
  z.object({
    action: z.literal('resync_product'),
    productId: z.string(),
  }),
]);

export const mlWebhookSchema = z.object({
  topic: z.string(),
  resource: z.string(),
  user_id: z.number(),
  application_id: z.number(),
  attempts: z.number(),
  sent: z.string(),
  received: z.string(),
});
