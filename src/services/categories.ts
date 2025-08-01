import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base";
import { CategoryType } from "@/types/categories";

export class CategoriesService extends BaseService<CategoryType> {
  constructor() {
    super('categories');
  }

  async getWithProductCount(): Promise<(CategoryType & { product_count: number })[]> {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        products:products(count)
      `)
      .order('name');
    
    if (error) this.handleError(error, 'Buscar categorias com contagem');
    
    return (data || []).map(category => ({
      ...category,
      product_count: category.products?.[0]?.count || 0
    }));
  }

  async validateName(name: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('categories')
      .select('id')
      .eq('name', name);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) this.handleError(error, 'Validar nome da categoria');
    return (data?.length || 0) === 0;
  }
}

export const categoriesService = new CategoriesService();