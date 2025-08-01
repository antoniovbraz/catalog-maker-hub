import { PRICING_CONFIG } from "@/lib/config";

export const MARKETPLACE_CONFIGS = {
  MERCADO_LIVRE_CLASSICO: {
    id: 'ml-classico',
    name: 'Mercado Livre Clássico',
    description: 'Anúncios tradicionais do Mercado Livre',
    url: 'https://mercadolivre.com.br',
    defaultCommission: 0.12,
    defaultFixedFee: 5.0,
  },
  MERCADO_LIVRE_PREMIUM: {
    id: 'ml-premium',
    name: 'Mercado Livre Premium',
    description: 'Anúncios premium com maior visibilidade',
    url: 'https://mercadolivre.com.br',
    defaultCommission: 0.16,
    defaultFixedFee: 3.0,
  },
  SHOPEE: {
    id: 'shopee',
    name: 'Shopee',
    description: 'Marketplace mobile-first',
    url: 'https://shopee.com.br',
    defaultCommission: 0.10,
    defaultFixedFee: 2.0,
  },
  AMAZON: {
    id: 'amazon',
    name: 'Amazon',
    description: 'Marketplace global da Amazon',
    url: 'https://amazon.com.br',
    defaultCommission: 0.15,
    defaultFixedFee: 4.0,
  },
  MAGALU: {
    id: 'magalu',
    name: 'Magalu',
    description: 'Marketplace do Magazine Luiza',
    url: 'https://magazineluiza.com.br',
    defaultCommission: 0.14,
    defaultFixedFee: 3.5,
  },
} as const;

export const DEFAULT_MARKETPLACES = Object.values(MARKETPLACE_CONFIGS);

export const MARKETPLACE_DEFAULTS = {
  TAXA_CARTAO: PRICING_CONFIG.DEFAULT_TAXA_CARTAO,
  PROVISAO_DESCONTO: PRICING_CONFIG.DEFAULT_PROVISAO_DESCONTO,
  FRETE_PADRAO: 15.0,
} as const;