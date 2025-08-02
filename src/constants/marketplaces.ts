import { PRICING_CONFIG } from "@/lib/config";

export const MARKETPLACE_CONFIGS = {
  // Marketplaces Pais
  MERCADO_LIVRE: {
    id: 'mercado-livre',
    name: 'Mercado Livre',
    description: 'Marketplace principal do Mercado Livre',
    url: 'https://mercadolivre.com.br',
    isParent: true,
  },
  SHOPEE: {
    id: 'shopee',
    name: 'Shopee',
    description: 'Marketplace mobile-first',
    url: 'https://shopee.com.br',
    isParent: true,
  },
  
  // Modalidades do Mercado Livre
  MERCADO_LIVRE_CLASSICO: {
    id: 'ml-classico',
    name: 'Mercado Livre Clássico',
    description: 'Anúncios tradicionais do Mercado Livre',
    url: 'https://mercadolivre.com.br',
    parent: 'mercado-livre',
    defaultCommission: 0.12,
    commissionRange: '10-14%',
    metadata: {
      announcement_type: 'classico',
      commission_range: '10-14%',
      fixed_fee_rules: 'variable'
    }
  },
  MERCADO_LIVRE_PREMIUM: {
    id: 'ml-premium',
    name: 'Mercado Livre Premium',
    description: 'Anúncios premium com maior visibilidade',
    url: 'https://mercadolivre.com.br',
    parent: 'mercado-livre',
    defaultCommission: 0.16,
    commissionRange: '15-19%',
    metadata: {
      announcement_type: 'premium',
      commission_range: '15-19%',
      fixed_fee_rules: 'variable',
      installments: '12x'
    }
  },
  MERCADO_LIVRE_LIVROS: {
    id: 'ml-livros',
    name: 'Mercado Livre Livros',
    description: 'Categoria específica para livros com regras diferenciadas',
    url: 'https://mercadolivre.com.br',
    parent: 'mercado-livre',
    defaultCommission: 0.12,
    commissionRange: '10-14%',
    metadata: {
      announcement_type: 'livros',
      category_restriction: 'books_only',
      special_fixed_fee: true
    }
  },
  
  // Modalidades do Shopee
  SHOPEE_NORMAL: {
    id: 'shopee-normal',
    name: 'Shopee Normal',
    description: 'Modalidade padrão do Shopee',
    url: 'https://shopee.com.br',
    parent: 'shopee',
    defaultCommission: 0.10,
    metadata: {
      shipping_type: 'normal',
      commission_cap: 100
    }
  },
  SHOPEE_FRETE_GRATIS: {
    id: 'shopee-frete-gratis',
    name: 'Shopee Frete Grátis',
    description: 'Modalidade com frete grátis',
    url: 'https://shopee.com.br',
    parent: 'shopee',
    defaultCommission: 0.10,
    metadata: {
      shipping_type: 'free',
      commission_cap: 100,
      free_shipping: true
    }
  },
  
  // Marketplaces independentes
  AMAZON: {
    id: 'amazon',
    name: 'Amazon',
    description: 'Marketplace global da Amazon',
    url: 'https://amazon.com.br',
    defaultCommission: 0.15,
    defaultFixedFee: 4.0,
    metadata: {
      global: true,
      platform_type: 'marketplace'
    }
  },
  MAGALU: {
    id: 'magalu',
    name: 'Magalu',
    description: 'Marketplace do Magazine Luiza',
    url: 'https://magazineluiza.com.br',
    defaultCommission: 0.14,
    defaultFixedFee: 3.5,
    metadata: {
      nacional: true,
      platform_type: 'marketplace'
    }
  },
} as const;

export const DEFAULT_MARKETPLACES = Object.values(MARKETPLACE_CONFIGS);

export const MARKETPLACE_DEFAULTS = {
  TAXA_CARTAO: PRICING_CONFIG.DEFAULT_TAXA_CARTAO,
  PROVISAO_DESCONTO: PRICING_CONFIG.DEFAULT_PROVISAO_DESCONTO,
  FRETE_PADRAO: 15.0,
} as const;