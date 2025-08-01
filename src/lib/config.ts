/**
 * Configurações centrais da aplicação
 */

// Configurações do React Query
export const QUERY_CONFIG = {
  STALE_TIME: 5 * 60 * 1000, // 5 minutos
  CACHE_TIME: 10 * 60 * 1000, // 10 minutos
  RETRY: 3,
  RETRY_DELAY: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
} as const;

// Configurações de UI
export const UI_CONFIG = {
  TOAST_DURATION: 3000,
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
} as const;

// Configurações de formulários
export const FORM_CONFIG = {
  AUTO_SAVE_DELAY: 2000,
  VALIDATION_DELAY: 300,
} as const;

// Configurações de paginação
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// Configurações de precificação
export const PRICING_CONFIG = {
  DEFAULT_TAXA_CARTAO: 3.5,
  DEFAULT_PROVISAO_DESCONTO: 2.0,
  DEFAULT_MARGEM_DESEJADA: 20.0,
  MIN_MARGIN: 0,
  MAX_MARGIN: 100,
  DECIMAL_PLACES: 2,
} as const;

// Configurações de formatação
export const FORMAT_CONFIG = {
  CURRENCY_LOCALE: 'pt-BR',
  CURRENCY_CODE: 'BRL',
  DATE_FORMAT: 'dd/MM/yyyy',
  DATETIME_FORMAT: 'dd/MM/yyyy HH:mm',
} as const;

// Configurações da aplicação
export const APP_CONFIG = {
  NAME: 'Catalog Maker Hub',
  VERSION: '1.0.0',
  DESCRIPTION: 'Sistema de Gestão de Marketplace e Precificação',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
} as const;

// Configurações de validação
export const VALIDATION_CONFIG = {
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 255,
  MIN_DESCRIPTION_LENGTH: 0,
  MAX_DESCRIPTION_LENGTH: 1000,
  MIN_SKU_LENGTH: 0,
  MAX_SKU_LENGTH: 50,
  MIN_PRICE: 0.01,
  MAX_PRICE: 999999.99,
} as const;