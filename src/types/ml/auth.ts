import { z } from 'zod';

export const mlAuthStatusResponseSchema = z.object({
  connected: z.boolean().optional().default(false),
  user_id_ml: z.number().optional(),
  ml_nickname: z.string().optional(),
  expires_at: z.string().optional().nullable(),
});

export type MLAuthStatusResponse = z.infer<typeof mlAuthStatusResponseSchema>;
