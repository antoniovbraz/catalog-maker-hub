import { describe, it, expect } from 'vitest';
import { calcularMargemRealLocal, calcularMargemUnitariaLocal } from '@/utils/pricing';

describe('Pricing Utils - Enhanced Tests', () => {
  describe('calcularMargemRealLocal with tax_rate', () => {
    it('should calculate margin with tax rate correctly', () => {
      const result = calcularMargemRealLocal(
        100,  // precoVenda
        40,   // custoTotal
        5,    // valorFixo
        10,   // frete
        12,   // comissao
        3,    // taxaCartao
        2,    // provisaoDesconto
        5     // taxRate (novo parâmetro)
      );
      
      // Total custos: 40 + 5 + 10 = 55
      // Comissão limitada: min(100 * 12/100, 100) = 12
      // Total taxas: 12 + 100 * (3 + 2 + 5)/100 = 12 + 10 = 22
      // Margem: (100 - 55 - 22) / 100 * 100 = 23%
      expect(result).toBeCloseTo(23, 1);
    });

    it('should handle commission limit correctly', () => {
      const result = calcularMargemRealLocal(
        50,   // precoVenda (baixo para testar limite)
        20,   // custoTotal
        2,    // valorFixo
        5,    // frete
        300,  // comissao (muito alta - 300%)
        2,    // taxaCartao
        1,    // provisaoDesconto
        3     // taxRate
      );
      
      // Comissão deve ser limitada a R$ 100, mas 50 * 300/100 = 150, limitado a 100
      // Como o preço é 50, a comissão limitada será min(150, 100) = 100
      // Mas 100 > 50, então a margem será negativa
      expect(result).toBeLessThan(0);
    });

    it('should work with zero tax rate', () => {
      const result = calcularMargemRealLocal(
        100, 40, 5, 10, 12, 3, 2, 0
      );
      
      // Deve ser igual ao teste sem tax_rate
      const expected = ((100 - 55 - 12 - 5) / 100) * 100; // 28%
      expect(result).toBeCloseTo(expected, 1);
    });
  });

  describe('calcularMargemUnitariaLocal with tax_rate', () => {
    it('should calculate unit margin with tax rate correctly', () => {
      const result = calcularMargemUnitariaLocal(
        100, 40, 5, 10, 12, 3, 2, 5
      );
      
      // Margem unitária = precoVenda - custos - taxas
      // = 100 - 55 - 12 - 10 = 23
      expect(result).toBeCloseTo(23, 1);
    });

    it('should handle negative unit margin', () => {
      const result = calcularMargemUnitariaLocal(
        50, 40, 10, 15, 20, 5, 3, 10
      );
      
      // Custos altos resultando em margem negativa
      expect(result).toBeLessThan(0);
    });
  });

  describe('Commission null category scenarios', () => {
    it('should handle commission calculation with null category', () => {
      // Este teste simula o cenário onde category_id é null
      // A função de pricing deve funcionar mesmo sem categoria específica
      const result = calcularMargemRealLocal(
        120, 50, 8, 12, 15, 4, 2, 6
      );
      
      // Resultado deve ser válido mesmo sem categoria
      expect(typeof result).toBe('number');
      expect(result).not.toBeNaN();
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle zero price correctly', () => {
      const result = calcularMargemRealLocal(
        0, 10, 2, 3, 10, 2, 1, 5
      );
      
      // Com preço zero, margem deve ser 0
      expect(result).toBe(0);
    });

    it('should handle very high commissions with limit', () => {
      const result = calcularMargemRealLocal(
        200, 80, 10, 15, 100, 3, 2, 8
      );
      
      // Comissão: min(200 * 100/100, 100) = min(200, 100) = 100
      // Total custos: 80 + 10 + 15 = 105
      // Taxas: 100 + 200 * (3+2+8)/100 = 100 + 26 = 126
      // Margem: (200 - 105 - 126) / 200 * 100 = -15.5%
      expect(result).toBeCloseTo(-15.5, 1);
    });

    it('should maintain precision with decimal values', () => {
      const result = calcularMargemRealLocal(
        99.99, 39.50, 4.25, 8.75, 11.5, 2.75, 1.25, 4.5
      );
      
      expect(result).not.toBeNaN();
      expect(Number.isFinite(result)).toBe(true);
    });
  });
});