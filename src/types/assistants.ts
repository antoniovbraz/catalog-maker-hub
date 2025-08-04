export interface Assistant {
  id: string;
  name: string;
  marketplace: 'mercado_livre' | 'shopee' | 'instagram';
  model: string;
  instructions: string;
  assistant_id: string; // OpenAI Assistant ID
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface AssistantFormData {
  name: string;
  marketplace: 'mercado_livre' | 'shopee' | 'instagram';
  model: string;
  instructions: string;
}

export const AVAILABLE_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
] as const;

export const MARKETPLACE_OPTIONS = [
  { value: 'mercado_livre', label: 'Mercado Livre' },
  { value: 'shopee', label: 'Shopee' },
  { value: 'instagram', label: 'Instagram' },
] as const;