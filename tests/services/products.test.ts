import { describe, it, expect, vi, beforeEach } from 'vitest';
import { testUtils } from '../setup';
import { productsService } from '@/services/products';
import { authService } from '@/services/auth';

// Helper para criar mock completo da query do Supabase
const createQueryMock = (overrides: Record<string, any> = {}) => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  ...overrides,
});

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
      const mockQuery = createQueryMock({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockProducts, error: null }),
      });
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await productsService.getAll();

      expect(testUtils.mockSupabaseClient.from).toHaveBeenCalledWith('products');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockProducts);
    });

    it('deve lançar erro quando Supabase retorna erro', async () => {
      const mockError = { message: 'Database error' };
      const mockQuery = createQueryMock({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      });
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

      const mockQuery = createQueryMock({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockProducts, error: null }),
      });
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
      
      const mockQuery = createQueryMock({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProduct, error: null }),
      });
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await productsService.getById('test-id');

      expect(testUtils.mockSupabaseClient.from).toHaveBeenCalledWith('products');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'test-id');
      expect(mockQuery.single).toHaveBeenCalled();
      expect(result).toEqual(mockProduct);
    });

    it('deve retornar null quando produto não encontrado', async () => {
      const mockQuery = createQueryMock({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' }
        }),
      });
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
      
      vi.spyOn(authService, 'getCurrentTenantId').mockResolvedValue('tenant-1');
      const mockQuery = createQueryMock({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCreatedProduct, error: null }),
      });
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await productsService.create(productData);

      expect(testUtils.mockSupabaseClient.from).toHaveBeenCalledWith('products');
      expect(mockQuery.insert).toHaveBeenCalledWith({ ...productData, tenant_id: 'tenant-1' });
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.single).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedProduct);
    });
  });

  describe('update', () => {
    it('deve atualizar produto com sucesso', async () => {
      const updateData = { name: 'Produto Atualizado', cost_unit: 150 };
      const mockUpdatedProduct = testUtils.createMockProduct(updateData);
      
      vi.spyOn(authService, 'getCurrentTenantId').mockResolvedValue('tenant-1');
      const mockQuery = createQueryMock({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedProduct, error: null }),
      });
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await productsService.update('test-id', updateData);

      expect(testUtils.mockSupabaseClient.from).toHaveBeenCalledWith('products');
      expect(mockQuery.update).toHaveBeenCalledWith(expect.objectContaining(updateData));
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'test-id');
      expect(result).toEqual(mockUpdatedProduct);
    });
  });

  describe('delete', () => {
    it('deve deletar produto com sucesso', async () => {
      vi.spyOn(authService, 'getCurrentTenantId').mockResolvedValue('tenant-1');
      const mockQuery = createQueryMock({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
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
      
      vi.spyOn(authService, 'getCurrentTenantId').mockResolvedValue('tenant-1');
      const mockQuery = createQueryMock({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockProducts, error: null }),
      });
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

      vi.spyOn(authService, 'getCurrentTenantId').mockResolvedValue('tenant-1');
      const mockQuery = createQueryMock({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockProducts, error: null }),
      });
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
      vi.spyOn(authService, 'getCurrentTenantId').mockResolvedValue('tenant-1');
      const mockQuery = createQueryMock({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      });
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await productsService.validateSKU('UNIQUE-SKU');

      expect(result).toBe(true);
      expect(mockQuery.eq).toHaveBeenCalledWith('sku', 'UNIQUE-SKU');
    });

    it('deve retornar false quando SKU já existe', async () => {
      vi.spyOn(authService, 'getCurrentTenantId').mockResolvedValue('tenant-1');
      const mockQueryExisting = createQueryMock({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ id: 'existing-id' }],
          error: null
        }),
      });
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQueryExisting);

      const result = await productsService.validateSKU('EXISTING-SKU');

      expect(result).toBe(false);
    });

    it('deve excluir ID específico na validação', async () => {
      vi.spyOn(authService, 'getCurrentTenantId').mockResolvedValue('tenant-1');
      const mockQueryExclude = createQueryMock({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockResolvedValue({ data: [], error: null }),
      });
      testUtils.mockSupabaseClient.from.mockReturnValue(mockQueryExclude);

      const result = await productsService.validateSKU('SKU-TEST', 'exclude-id');

      expect(mockQueryExclude.neq).toHaveBeenCalledWith('id', 'exclude-id');
      expect(result).toBe(true);
    });
  });
});