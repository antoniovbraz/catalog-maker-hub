/**
 * Calcula a margem real baseada no preço de venda praticado
 * Função auxiliar para validações locais quando necessário
 */
export function calcularMargemRealLocal(
  precoVenda: number,
  custoTotal: number,
  valorFixo: number,
  frete: number,
  comissao: number,
  taxaCartao: number,
  provisaoDesconto: number
): number {
  const totalCustos = custoTotal + valorFixo + frete;
  const totalTaxas = (precoVenda * (comissao + taxaCartao + provisaoDesconto)) / 100;
  
  return ((precoVenda - totalCustos - totalTaxas) / precoVenda) * 100;
}

/**
 * Calcula a margem unitária em valor absoluto
 * Função auxiliar para validações locais quando necessário
 */
export function calcularMargemUnitariaLocal(
  precoVenda: number,
  custoTotal: number,
  valorFixo: number,
  frete: number,
  comissao: number,
  taxaCartao: number,
  provisaoDesconto: number
): number {
  const totalCustos = custoTotal + valorFixo + frete;
  const totalTaxas = (precoVenda * (comissao + taxaCartao + provisaoDesconto)) / 100;
  
  return precoVenda - totalCustos - totalTaxas;
}

/**
 * Formata valor monetário
 */
  export function formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
      .format(valor)
      .replace(/\u00A0/g, ' ');
  }

/**
 * Formata percentual
 */
export function formatarPercentual(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor / 100);
}