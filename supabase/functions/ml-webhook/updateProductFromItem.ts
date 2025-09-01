export async function updateProductFromItem(
  supabase: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  tenantId: string,
  itemData: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  mlToken: string
): Promise<string[]> {
  const updatedFields: string[] = [];

  const { data: mapping, error: mappingError } = await supabase
    .from('ml_product_mapping')
    .select('product_id')
    .eq('tenant_id', tenantId)
    .eq('ml_item_id', itemData.id)
    .single();

  if (mappingError || !mapping?.product_id) {
    throw new Error('Product mapping not found');
  }

  let description = '';
  try {
    const descResponse = await fetch(`https://api.mercadolibre.com/items/${itemData.id}/description`, {
      headers: { Authorization: `Bearer ${mlToken}` }
    });
    if (descResponse.ok) {
      const descData = await descResponse.json();
      description = descData.plain_text || '';
    }
  } catch (e) {
    console.warn('Could not fetch description:', e);
  }

  let skuToUse = itemData.seller_sku || '';
  if (!skuToUse && itemData.variations?.length > 0) {
    skuToUse = itemData.variations[0].seller_sku || itemData.variations[0].id || '';
  }
  if (!skuToUse) {
    skuToUse = itemData.id;
  }

  const { error: updateError } = await supabase
    .from('products')
    .update({
      description: description,
      sku: skuToUse,
      ml_attributes: itemData.attributes || {},
      ml_pictures: itemData.pictures || [],
      ml_available_quantity: itemData.available_quantity || 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', mapping.product_id)
    .eq('tenant_id', tenantId);

  if (updateError) {
    throw new Error('Error updating product');
  }

  updatedFields.push('sku', 'description', 'attributes', 'pictures', 'stock');
  return updatedFields;
}
