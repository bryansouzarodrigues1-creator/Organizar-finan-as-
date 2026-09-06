/**
 * Utilitários financeiros determinísticos para manipulação de valores em centavos inteiros.
 * Evita erros clássicos de ponto flutuante em JavaScript (ex: 0.1 + 0.2 = 0.30000000000000004).
 */

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Converte centavos inteiros em formato monetário brasileiro legível (ex: 1250 -> "R$ 12,50").
 */
export function formatCents(cents: number): string {
  if (isNaN(cents) || !isFinite(cents)) {
    return 'R$ 0,00';
  }
  return brlFormatter.format(cents / 100);
}

/**
 * Converte uma entrada de texto brasileira ou número em centavos inteiros.
 * Suporta formatos: "1500,50", "1.500,50", "1500.50", "1500"
 */
export function parseToCents(val: string | number): number {
  if (typeof val === 'number') {
    if (isNaN(val) || !isFinite(val)) return 0;
    return Math.round(val * 100);
  }

  if (!val || typeof val !== 'string') return 0;

  // Remove caracteres que não são números, vírgula, ponto ou sinal negativo (como 'R$', espaços, etc.)
  const cleaned = val.replace(/[^\d,.-]/g, '').trim();
  if (cleaned === '' || cleaned === '-') return 0;

  // Se tiver vírgula como separador decimal (padrão brasileiro, ex: "1.500,50" ou "150,00")
  if (cleaned.includes(',')) {
    // Remove pontos de milhar e troca a vírgula decimal por ponto
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100);
  }

  // Se tiver pontos múltiplos (ex: "1.500.000")
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    const normalized = parts.join('');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100);
  }

  // Se tiver somente um ponto (ex: "150.50" ou "150")
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100);
}

/**
 * Converte centavos para string no formato do input (ex: 1250 -> "12,50")
 */
export function centsToInputValue(cents: number): string {
  if (cents === 0) return '';
  return (cents / 100).toFixed(2).replace('.', ',');
}

/**
 * Operações matemáticas seguras com centavos inteiros
 */
export function addCents(...values: number[]): number {
  return values.reduce((acc, curr) => acc + (Math.round(curr) || 0), 0);
}

export function subCents(a: number, b: number): number {
  return (Math.round(a) || 0) - (Math.round(b) || 0);
}
