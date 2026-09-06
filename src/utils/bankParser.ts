import { Transaction } from '../types';
import { parseToCents } from './money';

/**
 * Analisa o conteúdo de um arquivo OFX padrão de bancos brasileiros (Nubank, Inter, Itaú, Bradesco, etc.)
 */
export function parseOFX(ofxContent: string): Omit<Transaction, 'id' | 'createdAt'>[] {
  const transactions: Omit<Transaction, 'id' | 'createdAt'>[] = [];

  // Procura por blocos <STMTTRN>...</STMTTRN>
  const trnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match: RegExpExecArray | null;

  while ((match = trnRegex.exec(ofxContent)) !== null) {
    const block = match[1];

    // Tipo: <TRNTYPE>DEBIT ou CREDIT
    const trnTypeMatch = block.match(/<TRNTYPE>([^<\r\n]+)/i);
    const trnType = trnTypeMatch ? trnTypeMatch[1].trim().toUpperCase() : 'DEBIT';

    // Data: <DTPOSTED>YYYYMMDD...
    const dtMatch = block.match(/<DTPOSTED>(\d{4})(\d{2})(\d{2})/i);
    let dueDate = new Date().toISOString().slice(0, 10);
    if (dtMatch) {
      dueDate = `${dtMatch[1]}-${dtMatch[2]}-${dtMatch[3]}`;
    }

    // Valor: <TRNAMT>-125.50
    const amtMatch = block.match(/<TRNAMT>([^<\r\n]+)/i);
    const rawAmt = amtMatch ? amtMatch[1].trim() : '0';
    const numAmt = parseFloat(rawAmt.replace(',', '.'));
    const isIncome = numAmt > 0 || trnType === 'CREDIT';
    const absCents = Math.abs(Math.round(numAmt * 100));

    // Descrição: <MEMO> ou <NAME>
    const memoMatch = block.match(/<MEMO>([^<\r\n]+)/i);
    const nameMatch = block.match(/<NAME>([^<\r\n]+)/i);
    const rawDesc = memoMatch ? memoMatch[1].trim() : nameMatch ? nameMatch[1].trim() : 'Lançamento bancário';

    if (absCents > 0) {
      transactions.push({
        description: cleanDescription(rawDesc),
        amountInCents: absCents,
        type: isIncome ? 'income' : 'expense',
        status: 'completed', // Já consta no extrato do banco
        dueDate,
        paidDate: dueDate,
        category: categorizeDescription(rawDesc, isIncome),
      });
    }
  }

  return transactions;
}

/**
 * Analisa texto copiado e colado do extrato do app do banco (Pix, boletos, compras)
 * Suporta formatos comuns como:
 * "12/09 Pix enviado - João Silva R$ 150,00"
 * "10/09 Salário Empresa X +R$ 3.500,00"
 * "Supermercado Extra - R$ 240,50"
 */
export function parsePastedStatement(rawText: string, currentYear: string): Omit<Transaction, 'id' | 'createdAt'>[] {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const transactions: Omit<Transaction, 'id' | 'createdAt'>[] = [];

  const moneyRegex = /(?:R\$\s*|\+\s*|-\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}|\d+\.\d{2})/i;
  const dateRegex = /(\d{2})\/(\d{2})(?:\/(\d{2,4}))?/;

  for (const line of lines) {
    const moneyMatch = line.match(moneyRegex);
    if (!moneyMatch) continue;

    const amountInCents = parseToCents(moneyMatch[1]);
    if (amountInCents <= 0) continue;

    const dateMatch = line.match(dateRegex);
    let dueDate = new Date().toISOString().slice(0, 10);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      const year = dateMatch[3] ? (dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3]) : currentYear;
      dueDate = `${year}-${month}-${day}`;
    }

    // Detectar se é entrada ou saída
    const lower = line.toLowerCase();
    const isIncome =
      line.includes('+') ||
      lower.includes('recebido') ||
      lower.includes('salário') ||
      lower.includes('rendimento') ||
      lower.includes('depósito') ||
      lower.includes('transferência recebida');

    // Limpar descrição removendo a data e o valor
    let desc = line
      .replace(moneyRegex, '')
      .replace(dateRegex, '')
      .replace(/R\$/gi, '')
      .replace(/[-+]/g, '')
      .trim();

    if (!desc) {
      desc = isIncome ? 'Entrada bancária' : 'Saída bancária';
    }

    transactions.push({
      description: cleanDescription(desc),
      amountInCents,
      type: isIncome ? 'income' : 'expense',
      status: 'completed',
      dueDate,
      paidDate: dueDate,
      category: categorizeDescription(desc, isIncome),
    });
  }

  return transactions;
}

function cleanDescription(desc: string): string {
  return desc
    .replace(/\s+/g, ' ')
    .replace(/^[-:.]+|[-:.]+$/g, '')
    .trim();
}

function categorizeDescription(desc: string, isIncome: boolean): string {
  const d = desc.toLowerCase();
  if (isIncome) {
    if (d.includes('salario') || d.includes('salário') || d.includes('folha')) return 'Salário';
    if (d.includes('freelance') || d.includes('servico') || d.includes('serviço')) return 'Freelance';
    if (d.includes('rendimento') || d.includes('cdi') || d.includes('juros')) return 'Rendimentos';
    return 'Receitas Diversas';
  }

  if (d.includes('mercado') || d.includes('supermercado') || d.includes('alimentacao') || d.includes('almoço') || d.includes('padaria') || d.includes('ifood')) {
    return 'Alimentação';
  }
  if (d.includes('aluguel') || d.includes('condominio') || d.includes('condomínio') || d.includes('iptu')) {
    return 'Moradia';
  }
  if (d.includes('luz') || d.includes('energia') || d.includes('agua') || d.includes('água') || d.includes('gas') || d.includes('gás') || d.includes('internet') || d.includes('claro') || d.includes('vivo')) {
    return 'Contas Fixas';
  }
  if (d.includes('posto') || d.includes('combustivel') || d.includes('combustível') || d.includes('uber') || d.includes('99') || d.includes('gasolina')) {
    return 'Transporte';
  }
  if (d.includes('farmacia') || d.includes('farmácia') || d.includes('drogaria') || d.includes('consulta') || d.includes('hospital')) {
    return 'Saúde';
  }
  if (d.includes('emprestimo') || d.includes('empréstimo') || d.includes('parcela') || d.includes('fatura') || d.includes('cartao') || d.includes('cartão')) {
    return 'Dívidas / Parcelas';
  }

  return 'Outros';
}
