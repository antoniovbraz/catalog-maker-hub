import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { MLAuthService } from "./MLAuthService";

export interface MLSyncResult {
  success: boolean;
  message: string;
  ml_item_id?: string;
  error?: string;
}

/**
 * Service responsible only for ML synchronization operations
 * Following Single Responsibility Principle
 */
export class MLSyncService {
  static async syncProduct(productId: string, tenantId: string, forceUpdate = false): Promise<MLSyncResult> {
    logger.info('MLSyncService.syncProduct', 'Starting product sync', {
      productId,
      tenantId,
      forceUpdate
    });

    try {
      // Get valid token
      const token = await MLAuthService.getValidToken(tenantId);
      if (!token) {
        return {
          success: false,
          message: 'Token de acesso inválido ou expirado'
        };
      }

      // Check if already synced
      const { data: mapping } = await supabase
        .from('ml_product_mapping')
        .select('ml_item_id, sync_status')
        .eq('product_id', productId)
        .eq('tenant_id', tenantId)
        .single();

      if (mapping && mapping.sync_status === 'synced' && !forceUpdate) {
        return {
          success: true,
          message: 'Produto já sincronizado',
          ml_item_id: mapping.ml_item_id
        };
      }

      // Get product data
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          product_images(image_url, sort_order)
        `)
        .eq('id', productId)
        .single();

      if (productError || !product) {
        return {
          success: false,
          message: 'Produto não encontrado'
        };
      }

      // Prepare ML listing data
      const listingData = {
        title: product.name,
        description: product.description || '',
        price: product.cost_unit * 1.3, // Simple markup example
        currency_id: 'BRL',
        available_quantity: product.ml_available_quantity || 1,
        condition: 'new',
        listing_type_id: 'gold_special',
        pictures: product.product_images?.map((img: any) => ({ source: img.image_url })) || [],
        attributes: product.ml_attributes || {}
      };

      // Call ML API
      const endpoint = mapping?.ml_item_id 
        ? `https://api.mercadolibre.com/items/${mapping.ml_item_id}`
        : 'https://api.mercadolibre.com/items';
      
      const method = mapping?.ml_item_id ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error('MLSyncService.syncProduct', 'ML API error', {
          productId,
          tenantId,
          status: response.status,
          error: errorData
        });
        
        return {
          success: false,
          message: `Erro na API do ML: ${errorData.message || response.statusText}`,
          error: JSON.stringify(errorData)
        };
      }

      const mlItem = await response.json();

      // Update or create mapping
      await supabase
        .from('ml_product_mapping')
        .upsert({
          tenant_id: tenantId,
          product_id: productId,
          ml_item_id: mlItem.id,
          sync_status: 'synced',
          ml_price: mlItem.price,
          ml_permalink: mlItem.permalink,
          ml_title: mlItem.title,
          last_sync_at: new Date().toISOString()
        }, {
          onConflict: 'tenant_id,product_id'
        });

      logger.info('MLSyncService.syncProduct', 'Product synced successfully', {
        productId,
        tenantId,
        mlItemId: mlItem.id
      });

      return {
        success: true,
        message: 'Produto sincronizado com sucesso',
        ml_item_id: mlItem.id
      };

    } catch (error) {
      logger.error('MLSyncService.syncProduct', 'Sync error', {
        productId,
        tenantId,
        error: (error as Error).message
      });

      return {
        success: false,
        message: 'Erro interno na sincronização',
        error: (error as Error).message
      };
    }
  }

  static async getSyncStatus(tenantId: string) {
    const { data, error } = await supabase
      .from('ml_integration_status')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      logger.error('MLSyncService.getSyncStatus', 'Failed to get sync status', {
        tenantId,
        error: error.message
      });
      return null;
    }

    return data;
  }
}