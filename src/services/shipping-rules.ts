import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base";
import { ShippingRuleType } from "@/types/shipping";

class ShippingRulesService extends BaseService<ShippingRuleType> {
  constructor() {
    super("shipping_rules");
  }

  async getAllWithDetails(): Promise<ShippingRuleType[]> {
    const { data, error } = await supabase
      .from("shipping_rules")
      .select(`
        *,
        products:product_id (
          id,
          name
        ),
        marketplaces:marketplace_id (
          id,
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) this.handleError(error, "Buscar regras de frete");
    return data || [];
  }
}

export const shippingRulesService = new ShippingRulesService();
