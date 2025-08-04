import { describe, it, expect } from 'vitest';
import {
  isPositiveNumber,
  isValidPercentage,
  isValidEmail,
  isValidUrl,
  isValidSKU,
  sanitizeString,
  parseNumber,
} from '@/utils/validation';

describe('Validation Utils', () => {
  describe('isPositiveNumber', () => {
    it('deve retornar true para números positivos e zero', () => {
      expect(isPositiveNumber(10)).toBe(true);
      expect(isPositiveNumber(0)).toBe(true);
    });

    it('deve retornar false para números negativos ou não numéricos', () => {
      expect(isPositiveNumber(-5)).toBe(false);
      expect(isPositiveNumber('10')).toBe(false);
      expect(isPositiveNumber(NaN)).toBe(false);
    });
  });

  describe('isValidPercentage', () => {
    it('deve validar percentuais entre 0 e 100', () => {
      expect(isValidPercentage(0)).toBe(true);
      expect(isValidPercentage(50)).toBe(true);
      expect(isValidPercentage(100)).toBe(true);
    });

    it('deve rejeitar percentuais inválidos', () => {
      expect(isValidPercentage(-1)).toBe(false);
      expect(isValidPercentage(101)).toBe(false);
      expect(isValidPercentage('50')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('deve validar emails corretamente', () => {
      expect(isValidEmail('teste@exemplo.com')).toBe(true);
      expect(isValidEmail('usuario.nome+tag@dominio.co')).toBe(true);
    });

    it('deve rejeitar emails inválidos', () => {
      expect(isValidEmail('email-invalido')).toBe(false);
      expect(isValidEmail('usuario@dominio')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('deve validar URLs corretas', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com/path')).toBe(true);
    });

    it('deve rejeitar URLs inválidas', () => {
      expect(isValidUrl('notaurl')).toBe(false);
      expect(isValidUrl('http//missing.com')).toBe(false);
    });
  });

  describe('isValidSKU', () => {
    it('deve validar SKUs com caracteres permitidos', () => {
      expect(isValidSKU('ABC-123')).toBe(true);
      expect(isValidSKU('abc_123')).toBe(true);
    });

    it('deve rejeitar SKUs com caracteres inválidos', () => {
      expect(isValidSKU('abc 123')).toBe(false);
      expect(isValidSKU('abc$123')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('deve remover caracteres especiais e aparar espaços', () => {
      expect(sanitizeString(' Olá, Mundo! ')).toBe('Ol Mundo');
      expect(sanitizeString('***123abc***')).toBe('123abc');
    });
  });

  describe('parseNumber', () => {
    it('deve converter strings numéricas para número', () => {
      expect(parseNumber('123.45')).toBeCloseTo(123.45);
      expect(parseNumber('0')).toBe(0);
    });

    it('deve retornar 0 para strings não numéricas', () => {
      expect(parseNumber('abc')).toBe(0);
    });

    it('deve retornar o número original quando já for number', () => {
      expect(parseNumber(42)).toBe(42);
    });
  });
});

