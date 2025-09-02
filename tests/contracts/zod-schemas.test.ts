import { describe, it, expect } from 'vitest';
import {
  saleSchema,
  marketplaceSchema,
  productSchema,
  commissionSchema,
  categorySchema,
  pricingSchema,
  productImageSchema,
  adGenerationSchema,
  mlAdvancedSettingsSchema,
} from '@/types';

describe('Zod schema contract tests', () => {
  it('parses sale response', () => {
    const data = {
      id: 'sale-1',
      product_id: 'prod-1',
      marketplace_id: 'market-1',
      price_charged: 100,
      quantity: 2,
      sold_at: '2024-01-01T00:00:00Z',
    };
    expect(() => saleSchema.parse(data)).not.toThrow();
  });

  it('parses marketplace response', () => {
    const data = {
      id: 'market-1',
      name: 'Marketplace Test',
      description: 'Test marketplace',
      url: 'https://example.com',
      platform_id: '123e4567-e89b-12d3-a456-426614174000',
      marketplace_type: 'platform',
      category_restrictions: [],
      marketplace_metadata: { region: 'BR' },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
    expect(() => marketplaceSchema.parse(data)).not.toThrow();
  });

  it('parses product response', () => {
    const data = {
      id: 'prod-1',
      name: 'Product Test',
      sku: 'SKU123',
      description: 'A product',
      category_id: 'cat-1',
      cost_unit: 10,
      packaging_cost: 2,
      tax_rate: 5,
      source: 'manual',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
    const parsed = productSchema.parse(data);
    expect(parsed.sku_source).toBe('internal');
  });

  it('parses commission response', () => {
    const data = {
      id: 'com-1',
      marketplace_id: 'market-1',
      category_id: 'cat-1',
      rate: 10,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
    expect(() => commissionSchema.parse(data)).not.toThrow();
  });

  it('parses category response', () => {
    const data = {
      id: 'cat-1',
      name: 'Category Test',
      description: 'Category description',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
    expect(() => categorySchema.parse(data)).not.toThrow();
  });

  it('parses pricing response', () => {
    const data = {
      id: 'price-1',
      product_id: 'prod-1',
      marketplace_id: 'market-1',
      custo_total: 10,
      valor_fixo: 1,
      frete: 2,
      comissao: 5,
      taxa_cartao: 3,
      provisao_desconto: 1,
      margem_desejada: 10,
      preco_praticado: 20,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
    expect(() => pricingSchema.parse(data)).not.toThrow();
  });

  it('parses product image response', () => {
    const data = {
      id: 'img-1',
      product_id: '123e4567-e89b-12d3-a456-426614174000',
      image_type: 'product',
      sort_order: 0,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
    expect(() => productImageSchema.parse(data)).not.toThrow();
  });

  it('parses ad generation response', () => {
    const data = {
      product_id: '123e4567-e89b-12d3-a456-426614174000',
      marketplace: 'mercado_livre',
      image_urls: ['https://example.com/img1.png'],
      custom_prompt: 'Make it catchy',
    };
    expect(() => adGenerationSchema.parse(data)).not.toThrow();
  });

  it('parses ML advanced settings response', () => {
    const data = {
      id: 'adv-1',
      tenant_id: 'tenant-1',
      feature_flags: { auto_sync: true },
      rate_limits: { sync_product: 10, default: 5 },
      backup_schedule: 'daily',
      auto_recovery_enabled: true,
      advanced_monitoring: false,
      multi_account_enabled: false,
      security_level: 'high',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
    expect(() => mlAdvancedSettingsSchema.parse(data)).not.toThrow();
  });
});
