#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false }});

async function fetchCategoryPath(categoryId) {
  const res = await fetch(`https://api.mercadolibre.com/categories/${categoryId}`);
  if (!res.ok) return { id: categoryId, name: null, path: null };
  const json = await res.json();
  const path = json.path_from_root?.map(c => c.name).join(' > ');
  return { id: json.id, name: json.name, path };
}

async function syncProduct(product) {
  if (!product.ml_item_id) return;
  const res = await fetch(`https://api.mercadolibre.com/items/${product.ml_item_id}`);
  if (!res.ok) {
    console.warn(`Item ${product.ml_item_id} not found`);
    return;
  }
  const item = await res.json();
  const sku = item.seller_custom_field || null;
  const skuSource = sku ? 'mercado_livre' : 'none';
  const category = await fetchCategoryPath(item.category_id);

  if (category.name) {
    await supabase.from('ml_categories').upsert({
      id: category.id,
      name: category.name,
      path_from_root: category.path,
    });
  }

  await supabase.from('products').update({
    sku,
    sku_source: skuSource,
    category_ml_id: category.id,
    category_ml_path: category.path,
    updated_from_ml_at: new Date().toISOString(),
  }).eq('id', product.id);
}

async function run() {
  const { data, error } = await supabase
    .from('products')
    .select('id, ml_item_id')
    .eq('origin', 'mercado_livre');

  if (error) throw error;
  for (const product of data) {
    await syncProduct(product);
  }

  console.log('Alignment complete');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
