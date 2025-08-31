import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type SyncAction =
  | 'sync_product'
  | 'sync_batch'
  | 'import_from_ml'
  | 'link_product'
  | 'create_ad'
  | 'get_status'
  | 'get_products'
  | 'resync_product';

export interface GetStatusRequest { action: 'get_status'; }
export interface SyncProductRequest {
  action: 'sync_product';
  product_id: string;
  force_update?: boolean;
}
export interface SyncBatchRequest {
  action: 'sync_batch';
  product_ids: string[];
  force_update?: boolean;
}
export interface ImportFromMLRequest { action: 'import_from_ml'; }
export interface LinkProductRequest { action: 'link_product'; product_id: string; ml_item_id: string; }
export interface CreateAdRequest {
  action: 'create_ad';
  ad_data: Record<string, unknown>;
}
export interface GetProductsRequest { action: 'get_products'; }
export interface ResyncProductRequest { action: 'resync_product'; productId: string; }

export type SyncRequest =
  | GetStatusRequest
  | SyncProductRequest
  | SyncBatchRequest
  | ImportFromMLRequest
  | LinkProductRequest
  | CreateAdRequest
  | GetProductsRequest
  | ResyncProductRequest;

export interface ActionContext {
  supabase: SupabaseClient;
  tenantId: string;
  authToken: Record<string, unknown>;
  mlClientId: string;
  mlToken: string;
  jwt: string;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

export const errorResponse = (message: string, status: number) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
