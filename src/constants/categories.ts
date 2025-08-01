export const CATEGORY_CONFIGS = {
  ELETRONICOS: {
    id: 'eletronicos',
    name: 'Eletrônicos',
    description: 'Smartphones, tablets, notebooks, acessórios tecnológicos',
    typicalMargin: 25,
    averageShipping: 20,
  },
  CASA_DECORACAO: {
    id: 'casa-decoracao',
    name: 'Casa e Decoração',
    description: 'Móveis, decoração, utensílios domésticos',
    typicalMargin: 35,
    averageShipping: 30,
  },
  ROUPAS_ACESSORIOS: {
    id: 'roupas-acessorios',
    name: 'Roupas e Acessórios',
    description: 'Vestuário, calçados, bolsas, acessórios de moda',
    typicalMargin: 40,
    averageShipping: 15,
  },
  ESPORTES_FITNESS: {
    id: 'esportes-fitness',
    name: 'Esportes e Fitness',
    description: 'Equipamentos esportivos, roupas fitness, suplementos',
    typicalMargin: 30,
    averageShipping: 25,
  },
  LIVROS_MIDIA: {
    id: 'livros-midia',
    name: 'Livros e Mídia',
    description: 'Livros, DVDs, jogos, material educativo',
    typicalMargin: 20,
    averageShipping: 12,
  },
} as const;

export const DEFAULT_CATEGORIES = Object.values(CATEGORY_CONFIGS);

export const CATEGORY_DEFAULTS = {
  TYPICAL_MARGIN: 30,
  AVERAGE_SHIPPING: 20,
  TAX_RATE: 0,
} as const;