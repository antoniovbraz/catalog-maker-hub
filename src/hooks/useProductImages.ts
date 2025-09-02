import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  image_type: string;
  created_at: string;
  updated_at: string;
}

export function useProductImages(productId: string) {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  return useQuery<ProductImage[]>({
    queryKey: ['product_images', tenantId, productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });
      
      if (error) {
        console.error('Error fetching product images:', error);
        throw new Error(error.message);
      }
      
      return data || [];
    },
    enabled: !!productId && !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}