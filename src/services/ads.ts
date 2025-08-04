import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base";
import { ProductImage, AdGenerationRequest, AdGenerationResult } from "@/types/ads";
import { logger } from "@/utils/logger";

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
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${productId}/${fileName}`;

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

      // Salvar referência no banco
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

      // Extrair caminho do arquivo da URL
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
   * TODO: Implementar integração com OpenAI na próxima fase
   */
  async generateListing(request: AdGenerationRequest): Promise<AdGenerationResult> {
    try {
      logger.info('Iniciando geração de anúncio', 'AdsService', {
        productId: request.product_id,
        marketplace: request.marketplace,
        imageCount: request.image_urls.length
      });

      // TODO: Implementar chamada para OpenAI GPT
      // Esta função será expandida na próxima fase para:
      // 1. Buscar dados do produto no banco
      // 2. Analisar imagens enviadas
      // 3. Gerar prompts específicos por marketplace
      // 4. Chamar API da OpenAI
      // 5. Processar e formatar resposta

      // Por enquanto, retorna um resultado mock
      const mockResult: AdGenerationResult = {
        title: `[MOCK] Título para ${request.marketplace}`,
        description: `[MOCK] Descrição gerada automaticamente para o marketplace ${request.marketplace}`,
        keywords: ['mock', 'placeholder', request.marketplace],
        marketplace_specific_data: {
          generated_at: new Date().toISOString(),
          marketplace: request.marketplace,
          image_count: request.image_urls.length
        }
      };

      logger.info('Geração de anúncio concluída (mock)', 'AdsService', mockResult);
      return mockResult;
    } catch (error) {
      logger.error('Erro na geração de anúncio', 'AdsService', error);
      throw error;
    }
  }

  /**
   * Gera apenas descrição detalhada do produto
   * TODO: Implementar integração com OpenAI na próxima fase
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

      // TODO: Implementar lógica de geração de descrição
      // Esta função será expandida para analisar imagens e gerar
      // descrições detalhadas específicas para cada marketplace

      const mockDescription = `[MOCK] Descrição detalhada gerada para o marketplace ${marketplace} com base em ${imageUrls.length} imagem(ns).`;
      
      logger.info('Geração de descrição concluída (mock)', 'AdsService');
      return mockDescription;
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