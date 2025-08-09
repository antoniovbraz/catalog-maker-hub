import { useQuery } from "@tanstack/react-query";
import { shippingRulesService } from "@/services/shipping-rules";
import { ShippingRuleType } from "@/types/shipping";

export const SHIPPING_RULES_QUERY_KEY = ["shipping_rules"] as const;

export function useShippingRules() {
  return useQuery<ShippingRuleType[]>({
    queryKey: SHIPPING_RULES_QUERY_KEY,
    queryFn: () => shippingRulesService.getAllWithDetails(),
    staleTime: 5 * 60 * 1000,
  });
}
