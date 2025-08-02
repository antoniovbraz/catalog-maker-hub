import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base";

interface ShippingRuleType {
  id: string;
  product_id: string;
  marketplace_id: string;
  shipping_cost: number;
}

interface ShippingRuleWithDetails extends ShippingRuleType {
  products?: { id: string; name: string; sku: string };
  marketplaces?: { id: string; name: string };
}

export class ShippingRulesService extends BaseService<ShippingRuleType> {
  constructor() {
    super('shipping_rules');
  }

  async getAllWithDetails(): Promise<ShippingRuleWithDetails[]> {
    const { data, error } = await supabase
      .from('shipping_rules')
      .select(`
        *,
        products:product_id (
          id,
          name,
          sku
        ),
        marketplaces:marketplace_id (
          id,
          name
        )
      `)
      .order('shipping_cost', { ascending: false });

    if (error) this.handleError(error, 'Buscar regras de frete com detalhes');
    return (data as ShippingRuleWithDetails[]) || [];
  }
}

export const shippingRulesService = new ShippingRulesService();
