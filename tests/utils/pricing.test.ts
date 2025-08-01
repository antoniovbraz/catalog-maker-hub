import { describe, it, expect, vi, beforeEach } from 'vitest';
import { testUtils } from '../setup';
import { formatarMoeda, formatarPercentual, calcularMargemRealLocal, calcularMargemUnitariaLocal } from '@/utils/pricing';

describe('Pricing Utils', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
  });

  describe('formatarMoeda', () => {
    it('deve formatar valores monetários corretamente', () => {
      expect(formatarMoeda(1234.56)).toBe('R$ 1.234,56');
      expect(formatarMoeda(0)).toBe('R$ 0,00');
      expect(formatarMoeda(999999.99)).toBe('R$ 999.999,99');
    });

    it('deve formatar valores com casas decimais', () => {
      expect(formatarMoeda(10.5)).toBe('R$ 10,50');
      expect(formatarMoeda(10.123)).toBe('R$ 10,12');
    });
  });

  describe('formatarPercentual', () => {
    it('deve formatar percentuais corretamente', () => {
      expect(formatarPercentual(25)).toBe('25,00%');
      expect(formatarPercentual(0)).toBe('0,00%');
      expect(formatarPercentual(100)).toBe('100,00%');
    });

    it('deve formatar percentuais com casas decimais', () => {
      expect(formatarPercentual(25.5)).toBe('25,50%');
      expect(formatarPercentual(33.333)).toBe('33,33%');
    });
  });

  describe('calcularMargemRealLocal', () => {
    it('deve calcular margem real corretamente', () => {
      const result = calcularMargemRealLocal(
        200, // precoVenda
        100, // custoTotal
        10,  // valorFixo
        15,  // frete
        12,  // comissao
        3.5, // taxaCartao
        2    // provisaoDesconto
      );

      // Margem = ((200 - 100 - 10 - 15 - (200 * 17.5 / 100)) / 200) * 100
      // Margem = ((200 - 125 - 35) / 200) * 100 = (40 / 200) * 100 = 20%
      expect(result).toBeCloseTo(20, 1);
    });

    it('deve retornar margem negativa quando custos excedem receita', () => {
      const result = calcularMargemRealLocal(
        100, // precoVenda
        200, // custoTotal (maior que preço)
        10,  // valorFixo
        15,  // frete
        12,  // comissao
        3.5, // taxaCartao
        2    // provisaoDesconto
      );

      expect(result).toBeLessThan(0);
    });

    it('deve lidar com valores zero', () => {
      const result = calcularMargemRealLocal(
        100, // precoVenda
        0,   // custoTotal
        0,   // valorFixo
        0,   // frete
        0,   // comissao
        0,   // taxaCartao
        0    // provisaoDesconto
      );

      expect(result).toBe(100); // 100% de margem
    });
  });

  describe('calcularMargemUnitariaLocal', () => {
    it('deve calcular margem unitária corretamente', () => {
      const result = calcularMargemUnitariaLocal(
        200, // precoVenda
        100, // custoTotal
        10,  // valorFixo
        15,  // frete
        12,  // comissao
        3.5, // taxaCartao
        2    // provisaoDesconto
      );

      // Margem unitária = 200 - 100 - 10 - 15 - (200 * 17.5 / 100)
      // = 200 - 125 - 35 = 40
      expect(result).toBeCloseTo(40, 1);
    });

    it('deve retornar valor negativo quando custos excedem receita', () => {
      const result = calcularMargemUnitariaLocal(
        100, // precoVenda
        200, // custoTotal
        10,  // valorFixo
        15,  // frete
        12,  // comissao
        3.5, // taxaCartao
        2    // provisaoDesconto
      );

      expect(result).toBeLessThan(0);
    });
  });
});