import { describe, it, expect } from 'vitest';
import {
  generateAdSchema,
  generateAdChatSchema,
  assistantCreateSchema,
  assistantUpdateSchema,
  mlAuthSchema,
  mlSyncRequestSchema,
  mlWebhookSchema,
} from '../../supabase/functions/shared/schemas';

describe('supabase function schemas', () => {
  it('validates generate-ad request', () => {
    const payload = {
      assistant_id: 'a',
      product_info: 'info',
      marketplace: 'MLB',
      image_urls: ['url'],
      custom_prompt: 'prompt',
      description_only: true,
    };
    expect(generateAdSchema.parse(payload)).toEqual(payload);
  });

  it('validates generate-ad-chat request', () => {
    const payload = {
      message: 'hello',
      marketplace: 'MLB',
    };
    expect(generateAdChatSchema.parse(payload)).toMatchObject(payload);
  });

  it('validates assistants create request', () => {
    const payload = {
      name: 'assistant',
      marketplace: 'MLB',
      model: 'gpt',
      instructions: 'do things',
      tenant_id: 'tenant',
    };
    expect(assistantCreateSchema.parse(payload)).toEqual(payload);
  });

  it('validates assistants update request', () => {
    const payload = { name: 'new' };
    expect(assistantUpdateSchema.parse(payload)).toEqual(payload);
  });

  it('validates ml-auth request', () => {
    const payload = { action: 'start_auth' as const };
    expect(mlAuthSchema.parse(payload)).toEqual(payload);
  });

  it('validates ml-sync request', () => {
    const payload = { action: 'sync_product' as const, product_id: '1' };
    expect(mlSyncRequestSchema.parse(payload)).toEqual(payload);
  });

  it('validates ml webhook payload', () => {
    const payload = {
      topic: 'items',
      resource: '/items/1',
      user_id: 1,
      application_id: 1,
      attempts: 1,
      sent: '2020-01-01',
      received: '2020-01-01',
    };
    expect(mlWebhookSchema.parse(payload)).toEqual(payload);
  });
});
