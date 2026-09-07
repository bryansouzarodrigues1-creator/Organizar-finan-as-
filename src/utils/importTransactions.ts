import type { Transaction } from '../types';
export type ImportedTransaction = Omit<Transaction, 'id' | 'createdAt'>;
export function mergeImported(existing: Transaction[], incoming: ImportedTransaction[], now: string): Transaction[] {
  const legacy = existing.filter(t => !t.importKey && t.id.startsWith('tx-bank-'));
  const sameContent = (a: Transaction, b: ImportedTransaction) => a.dueDate === b.dueDate && a.type === b.type && a.amountInCents === b.amountInCents && a.description.trim().toLowerCase() === b.description.trim().toLowerCase();
  const seen = new Set(existing.flatMap(t => t.importKey ? [t.importKey] : []));
  const added: Transaction[] = [];
  for (const tx of incoming) {
    if (!tx.importKey) throw new Error('Lançamento importado sem identificador.');
    // Conservatively skip matches from the previous importer, which stored no bank ID.
    if (seen.has(tx.importKey) || legacy.some(old => sameContent(old, tx))) continue;
    seen.add(tx.importKey);
    added.push({ ...tx, id: crypto.randomUUID(), createdAt: now });
  }
  return [...added, ...existing];
}
