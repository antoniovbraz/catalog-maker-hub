export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  price_monthly: number;
  price_yearly?: number;
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
  features: any; // JSONB
  limits: any; // JSONB
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  trial_start?: string;
  trial_end?: string;
  created_at: string;
  updated_at: string;
  
  // Relações
  plan?: SubscriptionPlan;
}

export interface UsageTracking {
  id: string;
  user_id: string;
  tenant_id: string;
  resource_type: string;
  current_usage: number;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

export interface UsageLimits {
  products: number;
  marketplaces: number;
  api_calls_month: number;
  users?: number;
}

export interface PlanFeatures {
  price_pilot: boolean;
  basic_analytics?: boolean;
  advanced_analytics?: boolean;
  email_support?: boolean;
  priority_support?: boolean;
  bulk_operations?: boolean;
  custom_reports?: boolean;
  api_access?: boolean;
  multi_user?: boolean;
  custom_integrations?: boolean;
}