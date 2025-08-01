/**
 * Valida se um valor é um número positivo
 */
export function isPositiveNumber(value: any): boolean {
  return typeof value === 'number' && value >= 0 && !isNaN(value);
}

/**
 * Valida se um valor é um percentual válido (0-100)
 */
export function isValidPercentage(value: any): boolean {
  return isPositiveNumber(value) && value <= 100;
}

/**
 * Valida se um email é válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida se uma URL é válida
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida se um SKU é válido (alfanumérico e hífens)
 */
export function isValidSKU(sku: string): boolean {
  const skuRegex = /^[a-zA-Z0-9-_]+$/;
  return skuRegex.test(sku);
}

/**
 * Remove caracteres especiais de uma string, mantendo apenas letras e números
 */
export function sanitizeString(str: string): string {
  return str.replace(/[^a-zA-Z0-9\s]/g, '').trim();
}

/**
 * Converte string para número, retornando 0 se inválido
 */
export function parseNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}