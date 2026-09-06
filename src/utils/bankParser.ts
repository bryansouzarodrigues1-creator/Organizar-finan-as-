import type { Transaction } from '../types';
type Imported = Omit<Transaction, 'id' | 'createdAt'>;
function validDate(date: string): boolean {
  const d = new Date(date + 'T12:00:00Z');
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(+d) && d.toISOString().slice(0,10) === date;
}
function cents(raw: string): number {
  if (!/^[+-]?\d+(?:[.,]\d{1,2})?$/.test(raw)) throw Error('Valor inválido no extrato.');
  const [whole, fraction = ''] = raw.replace(/^[+-]/, '').split(/[.,]/);
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2,'0'));
  if (!Number.isSafeInteger(amount) || amount <= 0) throw Error('Valor inválido no extrato.');
  return amount;
}
function identities(items: Imported[], scope: string): Imported[] {
  const occurrences = new Map<string, number>();
  return items.map(t => {
    if (t.importKey) return t;
    const base = JSON.stringify([scope,t.dueDate,t.type,t.amountInCents,t.description.toLowerCase().replace(/\s+/g,' ')]);
    const count = (occurrences.get(base) || 0) + 1;
    occurrences.set(base,count);
    return {...t, importKey: JSON.stringify(['fallback',base,count])};
  });
}
export function parseOFX(content: string): Imported[] {
  const tag = (text: string, name: string) => text.match(new RegExp('<'+name+'>([^<\\r\\n]+)', 'i'))?.[1].trim();
  const scope = JSON.stringify([tag(content,'BANKID'),tag(content,'BRANCHID'),tag(content,'ACCTID'),tag(content,'ACCTTYPE')]);
  if (!tag(content,'ACCTID')) throw Error('OFX sem identificação da conta. Não foi importado.');
  const result: Imported[] = [];
  for (const match of content.matchAll(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi)) {
    const block = match[1];
    const posted = tag(block,'DTPOSTED');
    const dueDate = posted?.match(/^(\d{4})(\d{2})(\d{2})/);
    const date = dueDate ? `${dueDate[1]}-${dueDate[2]}-${dueDate[3]}` : '';
    if (!validDate(date)) throw Error('OFX com data ausente ou inválida. Confira o arquivo.');
    const raw = tag(block,'TRNAMT');
    if (!raw) throw Error('OFX com valor ausente.');
    const amountInCents = cents(raw);
    const income = !raw.startsWith('-');
    const description = cleanDescription(tag(block,'MEMO') || tag(block,'NAME') || 'Lançamento bancário');
    const fitid = tag(block,'FITID');
    result.push({description, amountInCents, type:income?'income':'expense',status:'completed',dueDate:date,paidDate:date,category:categorizeDescription(description,income),importKey:fitid ? JSON.stringify(['ofx',scope,fitid]) : undefined});
  }
  if (!result.length) throw Error('Nenhum lançamento OFX reconhecido. Confira o formato do arquivo.');
  return identities(result,scope);
}
export function parsePastedStatement(text: string, currentYear: string): Imported[] {
  const result: Imported[] = [];
  for (const line of text.split('\n').map(l=>l.trim()).filter(Boolean)) {
    const dateMatch = line.match(/(\d{2})\/(\d{2})(?:\/(\d{4}|\d{2}))?/);
    const values = [...line.matchAll(/(?:R\$\s*)?([+-]?\s*(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2})(?!\d)/g)];
    if (!dateMatch || values.length !== 1) throw Error('Cada linha precisa de uma data e um único valor em reais (ex.: 06/09/2026 Pix enviado -50,00).');
    const year = dateMatch[3] ? (dateMatch[3].length===2?'20'+dateMatch[3]:dateMatch[3]) : currentYear;
    const date = `${year}-${dateMatch[2]}-${dateMatch[1]}`;
    if (!validDate(date)) throw Error('Data inválida no texto.');
    const raw = values[0][1].replace(/\s|\./g,'');
    const lower = line.toLowerCase();
    const income = !raw.startsWith('-') && (raw.startsWith('+') || /recebid[oa]|salário|salario|rendimento|depósito/.test(lower));
    const description = cleanDescription(line.replace(values[0][0],'').replace(dateMatch[0],'').replace(/R\$/g,''));
    if (!description) throw Error('Inclua a descrição do lançamento.');
    result.push({description,amountInCents:cents(raw),type:income?'income':'expense',status:'completed',dueDate:date,paidDate:date,category:categorizeDescription(description,income)});
  }
  if (!result.length) throw Error('Cole ao menos um lançamento.');
  return identities(result,'pasted');
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
