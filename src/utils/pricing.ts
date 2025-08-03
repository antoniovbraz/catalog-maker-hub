/**
 * Calcula a margem real baseada no preço de venda praticado
 * Função auxiliar para validações locais quando necessário
 * IMPORTANTE: Deve manter consistência com calcular_margem_real do servidor
 */
export function calcularMargemRealLocal(
  precoVenda: number,
  custoTotal: number,
  valorFixo: number,
  frete: number,
  comissao: number,
  taxaCartao: number,
  provisaoDesconto: number,
  taxRate: number = 0
): number {
  const totalCustos = custoTotal + valorFixo + frete;
  const comissaoLimitada = Math.min(precoVenda * comissao / 100, 100.00);
  const totalTaxas = comissaoLimitada + (precoVenda * (taxaCartao + provisaoDesconto + taxRate)) / 100;
  
  return ((precoVenda - totalCustos - totalTaxas) / precoVenda) * 100;
}

/**
 * Calcula a margem unitária em valor absoluto
 * Função auxiliar para validações locais quando necessário
 * IMPORTANTE: Deve manter consistência com calcular_preco e calcular_margem_real do servidor
 */
export function calcularMargemUnitariaLocal(
  precoVenda: number,
  custoTotal: number,
  valorFixo: number,
  frete: number,
  comissao: number,
  taxaCartao: number,
  provisaoDesconto: number,
  taxRate: number = 0
): number {
  const totalCustos = custoTotal + valorFixo + frete;
  const comissaoLimitada = Math.min(precoVenda * comissao / 100, 100.00);
  const totalTaxas = comissaoLimitada + (precoVenda * (taxaCartao + provisaoDesconto + taxRate)) / 100;
  
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