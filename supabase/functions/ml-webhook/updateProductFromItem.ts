import { logger } from '../shared/logger.ts';

export interface PostgrestResponse<T> {
  data: T | null;
  error: unknown;
}

export interface PostgrestQuery<T>
  extends Promise<PostgrestResponse<T>> {
  select(columns: string): PostgrestQuery<T>;
  update(values: Record<string, unknown>): PostgrestQuery<T>;
  eq(
    column: string,
    value: unknown
  ): PostgrestQuery<T> | Promise<PostgrestResponse<T>>;
  single(): Promise<PostgrestResponse<T>>;
}

export interface SupabaseClient {
  from<T>(table: string): PostgrestQuery<T>;
}

export interface ItemAttribute {
  id: string;
  value_name?: string;
}

export interface ItemVariation {
  id: string | number;
  seller_custom_field?: string;
  seller_sku?: string;
  attributes?: ItemAttribute[];
}

export interface ItemData {
  id: string;
  seller_custom_field?: string;
  attributes?: ItemAttribute[];
  pictures?: { url: string }[];
  available_quantity?: number;
  category_id?: string;
  variations?: ItemVariation[];
}

export async function updateProductFromItem(
  supabase: SupabaseClient,
  tenantId: string,
  itemData: ItemData,
  mlToken: string
): Promise<string[]> {
  const updatedFields: string[] = [];

  const { data: mapping, error: mappingError } = await supabase
    .from('ml_product_mapping')
    .select('product_id, ml_variation_id')
    .eq('tenant_id', tenantId)
    .eq('ml_item_id', itemData.id)
    .single();

  if (mappingError || !mapping?.product_id) {
    throw new Error('Product mapping not found');
  }

  let description: string | undefined;
  try {
    const descResponse = await fetch(
      `https://api.mercadolibre.com/items/${itemData.id}/description`,
      {
        headers: { Authorization: `Bearer ${mlToken}` }
      }
    );
    if (descResponse.ok) {
      const descData = await descResponse.json();
      description = descData.plain_text || '';
    }
  } catch (e) {
    logger.warn('Could not fetch description', { tenantId, error: e });
  }

  let categoryPath = '';
  if (itemData.category_id) {
    try {
      const catResponse = await fetch(
        `https://api.mercadolibre.com/categories/${itemData.category_id}`,
        { headers: { Authorization: `Bearer ${mlToken}` } }
      );
      if (catResponse.ok) {
        const catData = await catResponse.json();
        categoryPath = (catData.path_from_root || [])
          .map((c: { name: string }) => c.name)
          .join(' > ');
      }
    } catch (e) {
      logger.warn('Could not fetch category', { tenantId, error: e });
    }
  }

  const variation =
    mapping?.ml_variation_id
      ? itemData.variations?.find(
          // Normalize IDs because ML API returns numbers and Supabase stores strings
          (v) => String(v.id) === String(mapping.ml_variation_id)
        )
      : itemData.variations?.[0];
  const mlSku =
    itemData.seller_custom_field ||
    itemData.attributes?.find((attr) => attr.id === 'SELLER_SKU')?.value_name ||
    variation?.seller_custom_field ||
    variation?.seller_sku ||
    variation?.attributes?.find((attr) => attr.id === 'SELLER_SKU')?.value_name ||
    variation?.id ||
    null;
  const skuSource = mlSku ? 'mercado_livre' : 'none';

  const updateData: Record<string, unknown> = {
    sku: mlSku,
    sku_source: skuSource,
    ml_attributes: itemData.attributes || {},
    ml_pictures: itemData.pictures || [],
    ml_available_quantity: itemData.available_quantity || 0,
    ml_seller_sku: mlSku,
    ml_variation_id: variation ? String(variation.id) : null,
    updated_at: new Date().toISOString(),
    updated_from_ml_at: new Date().toISOString(),
  };

  if (itemData.category_id) {
    updateData.category_ml_id = itemData.category_id;
    updateData.category_ml_path = categoryPath;
  }

  if (description !== undefined) {
    updateData.description = description;
  }

  const { error: updateError } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', mapping.product_id)
    .eq('tenant_id', tenantId);

  if (updateError) {
    throw new Error('Error updating product');
  }

  updatedFields.push('sku', 'attributes', 'pictures', 'stock');
  if (description !== undefined) {
    updatedFields.push('description');
  }
  return updatedFields;
}
