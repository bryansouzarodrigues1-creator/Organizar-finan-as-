import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Transaction, TransactionType, TransactionStatus } from '../types';
import { parseToCents, centsToInputValue, formatCents } from '../utils/money';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt'>, id?: string) => void;
  editingTransaction?: Transaction | null;
  defaultMonthYear: string;
}

const DEFAULT_EXPENSE_CATEGORIES = [
  'Moradia (Aluguel/Condomínio)',
  'Contas Fixas (Luz/Água/Gás)',
  'Alimentação / Supermercado',
  'Transporte / Combustível',
  'Saúde / Farmácia',
  'Educação',
  'Lazer / Pessoal',
  'Serviços / Assinaturas',
  'Outros',
];

const DEFAULT_INCOME_CATEGORIES = [
  'Salário',
  'Freelance / Bicos',
  'Comissão / Bônus',
  'Rendimentos',
  'Benefício',
  'Outras Entradas',
];

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
  defaultMonthYear,
}) => {
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [status, setStatus] = useState<TransactionStatus>('pending');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingTransaction) {
      setDescription(editingTransaction.description);
      setAmountStr(centsToInputValue(editingTransaction.amountInCents));
      setType(editingTransaction.type);
      setStatus(editingTransaction.status);
      setDueDate(editingTransaction.dueDate);
      setCategory(editingTransaction.category);
      setCustomCategory('');
    } else {
      // Novo lançamento padrão
      setDescription('');
      setAmountStr('');
      setType('expense');
      setStatus('pending');
      const today = new Date().toISOString().slice(0, 10);
      const isCurrentMonth = today.startsWith(defaultMonthYear);
      setDueDate(isCurrentMonth ? today : `${defaultMonthYear}-10`);
      setCategory(DEFAULT_EXPENSE_CATEGORIES[0]);
      setCustomCategory('');
    }
    setError(null);
  }, [editingTransaction, defaultMonthYear, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Informe a descrição do lançamento.');
      return;
    }

    const amountInCents = parseToCents(amountStr);
    if (amountInCents <= 0) {
      setError('Informe um valor válido maior que zero.');
      return;
    }

    if (!dueDate) {
      setError('Informe a data de vencimento.');
      return;
    }

    const finalCategory = category === 'Outro' && customCategory.trim()
      ? customCategory.trim()
      : category || 'Geral';

    onSave(
      {
        description: description.trim(),
        amountInCents,
        type,
        status,
        dueDate,
        paidDate: status === 'completed' ? dueDate : undefined,
        category: finalCategory,
      },
      editingTransaction?.id
    );

    onClose();
  };

  const categories = type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-modal-title"
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <h2 id="transaction-modal-title" className="text-base font-bold text-stone-900">
            {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Alternador Tipo: Receita vs Despesa */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1.5">
              Tipo de Movimentação
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('income');
                  setCategory(DEFAULT_INCOME_CATEGORIES[0]);
                }}
                className={`py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  type === 'income'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <span>Receita (+)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  setCategory(DEFAULT_EXPENSE_CATEGORIES[0]);
                }}
                className={`py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  type === 'expense'
                    ? 'bg-rose-50 border-rose-500 text-rose-900'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
                <span>Despesa (-)</span>
              </button>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="tx-description" className="block font-semibold text-stone-700 mb-1">
              Descrição
            </label>
            <input
              id="tx-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Conta de Energia, Salário, Internet"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 text-xs"
              required
            />
          </div>

          {/* Valor em Reais com cálculo em centavos */}
          <div>
            <label htmlFor="tx-amount" className="block font-semibold text-stone-700 mb-1">
              Valor (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-stone-700 font-semibold">R$</span>
              <input
                id="tx-amount"
                type="text"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0,00"
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 text-xs font-semibold"
                required
              />
            </div>
            {amountStr && (
              <span className="text-[11px] text-stone-700 mt-1 block">
                Valor interpretado: {formatCents(parseToCents(amountStr))}
              </span>
            )}
          </div>

          {/* Data de Vencimento e Situação */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tx-due-date" className="block font-semibold text-stone-700 mb-1">
                Data de Vencimento
              </label>
              <input
                id="tx-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 text-xs"
                required
              />
            </div>

            <div>
              <label htmlFor="tx-status" className="block font-semibold text-stone-700 mb-1">
                Situação
              </label>
              <select
                id="tx-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 text-xs font-medium"
              >
                <option value="pending">
                  {type === 'income' ? 'Prevista (A Receber)' : 'Pendente (A Pagar)'}
                </option>
                <option value="completed">
                  {type === 'income' ? 'Realizada (Recebida)' : 'Realizada (Já Paga)'}
                </option>
              </select>
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label htmlFor="tx-category" className="block font-semibold text-stone-700 mb-1">
              Categoria
            </label>
            <select
              id="tx-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 text-xs"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="Outro">Outro (especificar)</option>
            </select>

            {category === 'Outro' && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Digite o nome da categoria"
                className="w-full mt-2 px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 text-xs"
              />
            )}
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-900 font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition-colors"
            >
              {editingTransaction ? 'Salvar Alterações' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
