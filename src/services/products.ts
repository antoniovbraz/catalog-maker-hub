import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base";
import { ProductType, ProductWithCategory } from "@/types/products";

export class ProductsService extends BaseService<ProductType> {
  constructor() {
    super('products');
  }

  async getAllWithCategories(): Promise<ProductWithCategory[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories:category_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) this.handleError(error, 'Buscar produtos com categorias');
    return data || [];
  }

  async getByCategory(categoryId: string): Promise<ProductType[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .order('name');
    
    if (error) this.handleError(error, 'Buscar produtos por categoria');
    return data || [];
  }

  async searchByName(name: string): Promise<ProductType[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .ilike('name', `%${name}%`)
      .order('name');
    
    if (error) this.handleError(error, 'Buscar produtos por nome');
    return data || [];
  }

  async validateSKU(sku: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('products')
      .select('id')
      .eq('sku', sku);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) this.handleError(error, 'Validar SKU');
    return (data?.length || 0) === 0;
  }
}

export const productsService = new ProductsService();