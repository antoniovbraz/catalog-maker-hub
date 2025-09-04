// Simple validation schemas without external dependencies
// This avoids import issues with Deno edge functions

export interface GenerateAdRequest {
  assistant_id: string;
  product_info: string;
  marketplace: string;
  image_urls: string[];
  custom_prompt?: string;
  description_only?: boolean;
}

export interface GenerateAdChatRequest {
  thread_id?: string;
  message: string;
  product_info?: Record<string, unknown>;
  marketplace: string;
  is_initial_message?: boolean;
}

export interface AssistantCreateRequest {
  name: string;
  marketplace: string;
  model: string;
  instructions: string;
  tenant_id: string;
}

export interface AssistantUpdateRequest {
  name?: string;
  model?: string;
  instructions?: string;
}

export interface MLAuthRequest {
  action: 'start_auth' | 'handle_callback' | 'refresh_token' | 'get_status';
  code?: string;
  state?: string;
  tenant_id?: string;
}

export interface MLSyncRequest {
  action: 'get_status' | 'sync_product' | 'sync_batch' | 'import_from_ml' | 'link_product' | 'get_products' | 'create_ad' | 'resync_product';
  product_id?: string;
  product_ids?: string[];
  force_update?: boolean;
  ml_item_id?: string;
  ad_data?: Record<string, unknown>;
  productId?: string;
}

export interface MLWebhookPayload {
  topic: string;
  resource: string;
  user_id: number;
  application_id: number;
  attempts: number;
  sent: string;
  received: string;
}

// Simple validation functions
export function validateGenerateAdRequest(data: any): data is GenerateAdRequest {
  return data && 
    typeof data.assistant_id === 'string' &&
    typeof data.product_info === 'string' &&
    typeof data.marketplace === 'string' &&
    Array.isArray(data.image_urls);
}

export function validateGenerateAdChatRequest(data: any): data is GenerateAdChatRequest {
  return data && 
    typeof data.message === 'string' &&
    typeof data.marketplace === 'string';
}

export function validateAssistantCreateRequest(data: any): data is AssistantCreateRequest {
  return data && 
    typeof data.name === 'string' &&
    typeof data.marketplace === 'string' &&
    typeof data.model === 'string' &&
    typeof data.instructions === 'string' &&
    typeof data.tenant_id === 'string';
}

export function validateMLAuthRequest(data: any): data is MLAuthRequest {
  return data && 
    ['start_auth', 'handle_callback', 'refresh_token', 'get_status'].includes(data.action);
}

export function validateMLSyncRequest(data: any): data is MLSyncRequest {
  return data && 
    ['get_status', 'sync_product', 'sync_batch', 'import_from_ml', 'link_product', 'get_products', 'create_ad', 'resync_product'].includes(data.action);
}

export function validateMLWebhookPayload(data: any): data is MLWebhookPayload {
  return data && 
    typeof data.topic === 'string' &&
    typeof data.resource === 'string' &&
    typeof data.user_id === 'number';
}

// Legacy exports for backward compatibility with Zod-like interface
export const generateAdSchema = { 
  safeParse: (data: any) => ({ success: validateGenerateAdRequest(data), data }),
  parse: (data: any) => data // Simple pass-through for compatibility
};
export const generateAdChatSchema = { 
  safeParse: (data: any) => ({ success: validateGenerateAdChatRequest(data), data }),
  parse: (data: any) => data
};
export const assistantCreateSchema = { 
  safeParse: (data: any) => ({ success: validateAssistantCreateRequest(data), data }),
  parse: (data: any) => data
};
export const assistantUpdateSchema = { 
  safeParse: (data: any) => ({ success: true, data }),
  parse: (data: any) => data
};
export const mlAuthSchema = { 
  safeParse: (data: any) => ({ success: validateMLAuthRequest(data), data }),
  parse: (data: any) => data
};
export const mlSyncRequestSchema = { 
  safeParse: (data: any) => ({ success: validateMLSyncRequest(data), data }),
  parse: (data: any) => data
};
export const mlWebhookSchema = { 
  safeParse: (data: any) => ({ success: validateMLWebhookPayload(data), data }),
  parse: (data: any) => data
};