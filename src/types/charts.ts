/**
 * Tipos para componentes de gráficos com tipagem correta
 */

export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: string;
    payload: Record<string, number | string | boolean>;
  }>;
  label?: string;
}

export interface ChartLegendProps {
  payload?: Array<{
    value: string;
    type: string;
    color: string;
    id: string;
    payload?: Record<string, number | string | boolean>;
  }>;
}

export interface QuadrantData {
  name: string;
  value: number;
  count: number;
  color: string;
  description: string;
}

export interface ScatterData {
  margem: number;
  volume: number;
  nome: string;
  quadrant: string;
  color: string;
}

export interface RevenueData {
  month: string;
  quadrant_a: number;
  quadrant_b: number;
  quadrant_c: number;
  quadrant_d: number;
  total: number;
}

export interface ChartDataPoint {
  x: number;
  y: number;
  label: string;
  category?: string;
  value?: number;
}

export interface ChartConfig {
  [key: string]: {
    label: string;
    color: string;
  };
}