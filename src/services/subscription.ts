import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base";
import { SubscriptionPlan, Subscription, UsageTracking } from "@/types/subscription";

export class SubscriptionService extends BaseService<SubscriptionPlan> {
  constructor() {
    super('subscription_plans');
  }

  async getAllPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (error) throw new Error(`Erro ao buscar planos: ${error.message}`);
    return data || [];
  }

  async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Erro ao buscar assinatura: ${error.message}`);
    }
    
    return data;
  }

  async getUserUsage(userId: string, resourceType?: string): Promise<UsageTracking[]> {
    let query = supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('period_start', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
    
    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }
    
    const { data, error } = await query;
    
    if (error) throw new Error(`Erro ao buscar uso: ${error.message}`);
    return data || [];
  }

  async checkUsageLimit(userId: string, resourceType: string, increment: number = 1): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_usage_limit', {
      p_user_id: userId,
      p_resource_type: resourceType,
      p_increment: increment
    });

    if (error) throw new Error(`Erro ao verificar limite: ${error.message}`);
    return data;
  }

  async incrementUsage(userId: string, resourceType: string, increment: number = 1): Promise<void> {
    const { error } = await supabase.rpc('increment_usage', {
      p_user_id: userId,
      p_resource_type: resourceType,
      p_increment: increment
    });

    if (error) throw new Error(`Erro ao incrementar uso: ${error.message}`);
  }

  async createSubscription(subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscription)
      .select()
      .single();
    
    if (error) throw new Error(`Erro ao criar assinatura: ${error.message}`);
    return data;
  }

  async updateSubscription(userId: string, updates: Partial<Subscription>): Promise<Subscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw new Error(`Erro ao atualizar assinatura: ${error.message}`);
    return data;
  }

  async cancelSubscription(userId: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'canceled',
        cancel_at_period_end: true 
      })
      .eq('user_id', userId);
    
    if (error) throw new Error(`Erro ao cancelar assinatura: ${error.message}`);
  }
}

export const subscriptionService = new SubscriptionService();