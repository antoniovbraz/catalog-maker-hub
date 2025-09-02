export async function updateProductFromItem(
  supabase: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  tenantId: string,
  itemData: any, // eslint-disable-line @typescript-eslint/no-explicit-any
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
    console.warn('Could not fetch description:', e);
  }

  const variation =
    mapping?.ml_variation_id
      ? itemData.variations?.find(
          // Normalize IDs because ML API returns numbers and Supabase stores strings
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (v: any) => String(v.id) === String(mapping.ml_variation_id)
        )
      : itemData.variations?.[0];
  const mlSku =
    itemData.seller_custom_field ||
    itemData.attributes?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (attr: any) => attr.id === 'SELLER_SKU'
    )?.value_name ||
    variation?.seller_custom_field ||
    variation?.seller_sku ||
    variation?.attributes?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (attr: any) => attr.id === 'SELLER_SKU'
    )?.value_name ||
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
