import { describe, it, expect, vi, beforeEach } from 'vitest';
import { testUtils } from '../setup';
import { productsService } from '@/services/products';

// Mock do Supabase é feito no setup.ts
describe('ProductsService', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
  });

  describe('getAll', () => {
    it('deve retornar todos os produtos', async () => {
      const mockProducts = [
        testUtils.createMockProduct({ id: '1', name: 'Produto 1' }),
        testUtils.createMockProduct({ id: '2', name: 'Produto 2' }),
      ];

      // Mock da resposta do Supabase
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockProducts, error: null }),
      };
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await productsService.getAll();

      expect(testUtils.mockSupabaseClient.from).toHaveBeenCalledWith('products');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockProducts);
    });

    it('deve lançar erro quando Supabase retorna erro', async () => {
      const mockError = { message: 'Database error' };
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      };
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      await expect(productsService.getAll()).rejects.toThrow('Buscar products falhou: Database error');
    });
  });

  describe('getAllWithCategories', () => {
    it('deve retornar produtos com categorias', async () => {
      const mockProducts = [
        {
          ...testUtils.createMockProduct({ id: '1', name: 'Produto 1', category_id: 'cat1' }),
          categories: testUtils.createMockCategory({ id: 'cat1', name: 'Categoria 1' }),
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockProducts, error: null }),
      };
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await productsService.getAllWithCategories();

      expect(testUtils.mockSupabaseClient.from).toHaveBeenCalledWith('products');
      expect(mockQuery.select).toHaveBeenCalledWith(expect.stringContaining('categories:category_id'));
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockProducts);
    });
  });

  describe('getById', () => {
    it('deve retornar produto por ID', async () => {
      const mockProduct = testUtils.createMockProduct({ id: 'test-id' });
      
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProduct, error: null }),
      };
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await productsService.getById('test-id');

      expect(testUtils.mockSupabaseClient.from).toHaveBeenCalledWith('products');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'test-id');
      expect(mockQuery.single).toHaveBeenCalled();
      expect(result).toEqual(mockProduct);
    });

    it('deve retornar null quando produto não encontrado', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST116', message: 'Not found' } 
        }),
      };
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await productsService.getById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('deve criar produto com sucesso', async () => {
      const productData = {
        name: 'Novo Produto',
        cost_unit: 100,
        packaging_cost: 10,
        tax_rate: 18,
      };
      
      const mockCreatedProduct = testUtils.createMockProduct(productData);
      
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCreatedProduct, error: null }),
      };
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await productsService.create(productData);

      expect(testUtils.mockSupabaseClient.from).toHaveBeenCalledWith('products');
      expect(mockQuery.insert).toHaveBeenCalledWith(productData);
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.single).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedProduct);
    });
  });

  describe('update', () => {
    it('deve atualizar produto com sucesso', async () => {
      const updateData = { name: 'Produto Atualizado', cost_unit: 150 };
      const mockUpdatedProduct = testUtils.createMockProduct(updateData);
      
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedProduct, error: null }),
      };
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await productsService.update('test-id', updateData);

      expect(testUtils.mockSupabaseClient.from).toHaveBeenCalledWith('products');
      expect(mockQuery.update).toHaveBeenCalledWith(updateData);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'test-id');
      expect(result).toEqual(mockUpdatedProduct);
    });
  });

  describe('delete', () => {
    it('deve deletar produto com sucesso', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      await expect(productsService.delete('test-id')).resolves.toBeUndefined();

      expect(testUtils.mockSupabaseClient.from).toHaveBeenCalledWith('products');
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'test-id');
    });
  });

  describe('getByCategory', () => {
    it('deve retornar produtos por categoria', async () => {
      const mockProducts = [
        testUtils.createMockProduct({ category_id: 'test-category' }),
      ];
      
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockProducts, error: null }),
      };
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await productsService.getByCategory('test-category');

      expect(mockQuery.eq).toHaveBeenCalledWith('category_id', 'test-category');
      expect(result).toEqual(mockProducts);
    });
  });

  describe('searchByName', () => {
    it('deve buscar produtos por nome usando ilike', async () => {
      const searchTerm = 'Prod';
      const mockProducts = [testUtils.createMockProduct({ name: 'Produto 1' })];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockProducts, error: null }),
      };
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await productsService.searchByName(searchTerm);

      expect(testUtils.mockSupabaseClient.from).toHaveBeenCalledWith('products');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.ilike).toHaveBeenCalledWith('name', `%${searchTerm}%`);
      expect(mockQuery.order).toHaveBeenCalledWith('name');
      expect(result).toEqual(mockProducts);
    });
  });

  describe('validateSKU', () => {
    it('deve retornar true quando SKU é único', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await productsService.validateSKU('UNIQUE-SKU');

      expect(result).toBe(true);
      expect(mockQuery.eq).toHaveBeenCalledWith('sku', 'UNIQUE-SKU');
    });

    it('deve retornar false quando SKU já existe', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ 
          data: [{ id: 'existing-id' }], 
          error: null 
        }),
      };
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await productsService.validateSKU('EXISTING-SKU');

      expect(result).toBe(false);
    });

    it('deve excluir ID específico na validação', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await productsService.validateSKU('SKU-TEST', 'exclude-id');

      expect(mockQuery.neq).toHaveBeenCalledWith('id', 'exclude-id');
      expect(result).toBe(true);
    });
  });
});