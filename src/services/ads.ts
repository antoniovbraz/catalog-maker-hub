import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base";
import { ProductImage, AdGenerationRequest, AdGenerationResult } from "@/types/ads";
import { logger } from "@/utils/logger";
import { assistantsService } from "./assistants";

export class AdsService extends BaseService<ProductImage> {
  constructor() {
    super('product_images');
  }

  // === GESTÃO DE IMAGENS ===
  
  async getProductImages(productId: string): Promise<ProductImage[]> {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });
      
      if (error) this.handleError(error, 'Buscar imagens do produto');
      return (data || []) as ProductImage[];
    } catch (error) {
      logger.error('Erro ao buscar imagens do produto', 'AdsService', error);
      throw error;
    }
  }

  async uploadProductImage(
    productId: string, 
    file: File, 
    imageType: string = 'product',
    sortOrder: number = 0
  ): Promise<ProductImage> {
    try {
      // Buscar tenant_id do usuário
      const { authService } = await import('./auth');
      const tenantId = await authService.getCurrentTenantId();
      
      if (!tenantId) {
        throw new Error('Tenant ID não encontrado');
      }

      // Gerar nome único para o arquivo com estrutura tenant_id/product_id/arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${tenantId}/${productId}/${fileName}`;

      // Upload do arquivo para o Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        logger.error('Erro no upload da imagem', 'AdsService', uploadError);
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      // Obter URL pública da imagem
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // Salvar referência no banco (tenant_id será adicionado automaticamente pelo BaseService)
      const imageData = {
        product_id: productId,
        image_url: publicUrl,
        image_type: imageType as 'product' | 'package' | 'specification' | 'detail',
        sort_order: sortOrder,
      };

      const savedImage = await this.create(imageData);
      logger.info('Imagem do produto salva com sucesso', 'AdsService', { productId, imageType });
      
      return savedImage;
    } catch (error) {
      logger.error('Erro ao fazer upload da imagem', 'AdsService', error);
      throw error;
    }
  }

  async deleteProductImage(imageId: string): Promise<void> {
    try {
      // Buscar dados da imagem antes de deletar
      const image = await this.getById(imageId);
      if (!image) {
        throw new Error('Imagem não encontrada');
      }

      // Extrair caminho do arquivo da URL (agora no formato tenant_id/product_id/arquivo)
      const url = new URL(image.image_url);
      const filePath = url.pathname.split('/product-images/')[1];

      // Deletar arquivo do Storage
      const { error: storageError } = await supabase.storage
        .from('product-images')
        .remove([filePath]);

      if (storageError) {
        logger.warn('Erro ao deletar arquivo do storage', 'AdsService', storageError);
        // Continuar mesmo com erro no storage para não travar a exclusão
      }

      // Deletar referência do banco
      await this.delete(imageId);
      logger.info('Imagem do produto deletada com sucesso', 'AdsService', { imageId });
    } catch (error) {
      logger.error('Erro ao deletar imagem', 'AdsService', error);
      throw error;
    }
  }

  // === GERAÇÃO DE ANÚNCIOS (PREPARAÇÃO PARA IA) ===

  /**
   * Gera título e descrição para anúncio usando IA
   */
  async generateListing(request: AdGenerationRequest): Promise<AdGenerationResult> {
    try {
      logger.info('Iniciando geração de anúncio', 'AdsService', {
        productId: request.product_id,
        marketplace: request.marketplace,
        imageCount: request.image_urls.length
      });

      // Buscar assistente configurado para o marketplace
      const assistant = await assistantsService.getAssistantByMarketplace(request.marketplace);
      if (!assistant) {
        throw new Error(`Nenhum assistente configurado para o marketplace ${request.marketplace}`);
      }

      // Buscar dados do produto
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('id', request.product_id)
        .single();

      if (productError || !product) {
        throw new Error('Produto não encontrado');
      }

      // Preparar prompt com dados do produto e marketplace
      const productInfo = `
Produto: ${product.name}
Categoria: ${product.categories?.name || 'Não especificada'}
Descrição: ${product.description || 'Não informada'}
SKU: ${product.sku || 'Não informado'}
Preço: R$ ${product.cost_unit}

Marketplace: ${request.marketplace}
Número de imagens: ${request.image_urls.length}
Prompt personalizado: ${request.custom_prompt || 'Nenhum'}
      `.trim();

      // Chamar edge function para gerar anúncio
      const { data: result, error } = await supabase.functions.invoke('generate-ad', {
        body: {
          assistant_id: assistant.assistant_id,
          product_info: productInfo,
          marketplace: request.marketplace,
          image_urls: request.image_urls,
          custom_prompt: request.custom_prompt
        }
      });

      if (error) {
        logger.error('Erro na chamada da edge function', 'AdsService', error);
        throw new Error(`Erro na geração: ${error.message}`);
      }

      const adResult: AdGenerationResult = {
        title: result.title || '',
        description: result.description || '',
        keywords: result.keywords || [],
        marketplace_specific_data: {
          generated_at: new Date().toISOString(),
          marketplace: request.marketplace,
          image_count: request.image_urls.length,
          assistant_used: assistant.name
        }
      };

      logger.info('Geração de anúncio concluída', 'AdsService', adResult);
      return adResult;
    } catch (error) {
      logger.error('Erro na geração de anúncio', 'AdsService', error);
      throw error;
    }
  }

  /**
   * Gera apenas descrição detalhada do produto
   */
  async generateDescription(
    productId: string, 
    imageUrls: string[], 
    marketplace: string
  ): Promise<string> {
    try {
      logger.info('Iniciando geração de descrição', 'AdsService', {
        productId,
        marketplace,
        imageCount: imageUrls.length
      });

      // Buscar assistente configurado para o marketplace
      const assistant = await assistantsService.getAssistantByMarketplace(marketplace);
      if (!assistant) {
        throw new Error(`Nenhum assistente configurado para o marketplace ${marketplace}`);
      }

      // Buscar dados do produto
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        throw new Error('Produto não encontrado');
      }

      // Preparar prompt específico para descrição
      const productInfo = `
Produto: ${product.name}
Categoria: ${product.categories?.name || 'Não especificada'}
Descrição atual: ${product.description || 'Não informada'}
SKU: ${product.sku || 'Não informado'}

Gere apenas uma descrição detalhada e atrativa para este produto no ${marketplace}.
      `.trim();

      // Chamar edge function para gerar descrição
      const { data: result, error } = await supabase.functions.invoke('generate-ad', {
        body: {
          assistant_id: assistant.assistant_id,
          product_info: productInfo,
          marketplace,
          image_urls: imageUrls,
          description_only: true
        }
      });

      if (error) {
        logger.error('Erro na chamada da edge function', 'AdsService', error);
        throw new Error(`Erro na geração: ${error.message}`);
      }

      const description = result.description || '';
      logger.info('Geração de descrição concluída', 'AdsService');
      return description;
    } catch (error) {
      logger.error('Erro na geração de descrição', 'AdsService', error);
      throw error;
    }
  }

  // === UTILITÁRIOS ===

  async reorderImages(productId: string, imageOrders: { id: string; sort_order: number }[]): Promise<void> {
    try {
      const promises = imageOrders.map(({ id, sort_order }) =>
        this.update(id, { sort_order })
      );
      
      await Promise.all(promises);
      logger.info('Ordem das imagens atualizada', 'AdsService', { productId, count: imageOrders.length });
    } catch (error) {
      logger.error('Erro ao reordenar imagens', 'AdsService', error);
      throw error;
    }
  }

  async getProductImagesCount(productId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('product_images')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId);
      
      if (error) this.handleError(error, 'Contar imagens do produto');
      return count || 0;
    } catch (error) {
      logger.error('Erro ao contar imagens do produto', 'AdsService', error);
      return 0;
    }
  }
}

export const adsService = new AdsService();