import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Debt } from '../types';
import { parseToCents, centsToInputValue, formatCents } from '../utils/money';

interface DebtFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (debt: Omit<Debt, 'id' | 'createdAt'>, id?: string) => void;
  editingDebt?: Debt | null;
}

export const DebtFormModal: React.FC<DebtFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingDebt,
}) => {
  const [name, setName] = useState('');
  const [totalDebtStr, setTotalDebtStr] = useState('');
  const [installmentAmountStr, setInstallmentAmountStr] = useState('');
  const [totalInstallments, setTotalInstallments] = useState(12);
  const [remainingInstallments, setRemainingInstallments] = useState(12);
  const [dueDayOfMonth, setDueDayOfMonth] = useState(10);
  const [interestRateText, setInterestRateText] = useState('');
  const [interestRateMonthly, setInterestRateMonthly] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingDebt) {
      setName(editingDebt.name);
      setTotalDebtStr(centsToInputValue(editingDebt.totalDebtInCents));
      setInstallmentAmountStr(centsToInputValue(editingDebt.installmentAmountInCents));
      setTotalInstallments(editingDebt.totalInstallments);
      setRemainingInstallments(editingDebt.remainingInstallments);
      setDueDayOfMonth(editingDebt.dueDayOfMonth);
      setInterestRateText(editingDebt.interestRateText || '');
      setInterestRateMonthly(editingDebt.interestRateMonthly !== undefined ? String(editingDebt.interestRateMonthly) : '');
      setNotes(editingDebt.notes || '');
    } else {
      setName('');
      setTotalDebtStr('');
      setInstallmentAmountStr('');
      setTotalInstallments(12);
      setRemainingInstallments(12);
      setDueDayOfMonth(10);
      setInterestRateText('');
      setInterestRateMonthly('');
      setNotes('');
    }
    setError(null);
  }, [editingDebt, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Informe o nome da dívida ou credor.');
      return;
    }

    const totalDebtInCents = parseToCents(totalDebtStr);
    const installmentAmountInCents = parseToCents(installmentAmountStr);

    if (totalDebtInCents <= 0) {
      setError('Informe o saldo devedor total válido maior que zero.');
      return;
    }

    if (installmentAmountInCents <= 0) {
      setError('Informe o valor da parcela mensal.');
      return;
    }

    if (remainingInstallments > totalInstallments) {
      setError('O número de parcelas restantes não pode ser maior que o total de parcelas.');
      return;
    }

    let monthlyRate: number | undefined;
    if (interestRateMonthly.trim() !== '') {
      const raw = interestRateMonthly.trim().replace(',', '.');
      const parsed = Number(raw);
      if (!/^\d+(?:\.\d{1,6})?$/.test(raw) || !Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
        setError('Informe a taxa mensal de 0 a 100%, com até seis casas decimais.');
        return;
      }
      monthlyRate = parsed;
    }
    // Texto livre pode conter taxa anual ou CET; nunca inferir taxa mensal dele.

    onSave(
      {
        name: name.trim(),
        totalDebtInCents,
        installmentAmountInCents,
        totalInstallments: Number(totalInstallments),
        remainingInstallments: Number(remainingInstallments),
        dueDayOfMonth: Number(dueDayOfMonth),
        interestRateText: interestRateText.trim() || undefined,
        interestRateMonthly: monthlyRate,
        notes: notes.trim() || undefined,
        lastPaymentMonthYear: editingDebt?.lastPaymentMonthYear,
      },
      editingDebt?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="debt-modal-title"
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <h2 id="debt-modal-title" className="text-base font-bold text-stone-900">
            {editingDebt ? 'Editar Dívida / Empréstimo' : 'Cadastrar Dívida ou Empréstimo'}
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {/* Nome da Dívida */}
          <div>
            <label htmlFor="debt-name" className="block font-semibold text-stone-700 mb-1">
              Nome da Dívida / Credor
            </label>
            <input
              id="debt-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Empréstimo Caixa, Cartão de Crédito, Financiamento Carro"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 text-xs"
              required
            />
          </div>

          {/* Saldo Devedor Total e Valor da Parcela */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="debt-total" className="block font-semibold text-stone-700 mb-1">
                Saldo Devedor Total (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-stone-700 font-semibold">R$</span>
                <input
                  id="debt-total"
                  type="text"
                  value={totalDebtStr}
                  onChange={(e) => setTotalDebtStr(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-8 pr-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 text-xs font-semibold"
                  required
                />
              </div>
              {totalDebtStr && (
                <span className="text-[10px] text-stone-700 mt-0.5 block">
                  {formatCents(parseToCents(totalDebtStr))}
                </span>
              )}
            </div>

            <div>
              <label htmlFor="debt-installment" className="block font-semibold text-stone-700 mb-1">
                Valor da Parcela (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-stone-700 font-semibold">R$</span>
                <input
                  id="debt-installment"
                  type="text"
                  value={installmentAmountStr}
                  onChange={(e) => setInstallmentAmountStr(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-8 pr-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 text-xs font-semibold"
                  required
                />
              </div>
              {installmentAmountStr && (
                <span className="text-[10px] text-stone-700 mt-0.5 block">
                  {formatCents(parseToCents(installmentAmountStr))}
                </span>
              )}
            </div>
          </div>

          {/* Parcelas e Dia do Vencimento */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label htmlFor="debt-total-inst" className="block font-semibold text-stone-700 mb-1">
                Total Parcelas
              </label>
              <input
                id="debt-total-inst"
                type="number"
                min="1"
                max="360"
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 text-xs"
                required
              />
            </div>

            <div>
              <label htmlFor="debt-rem-inst" className="block font-semibold text-stone-700 mb-1">
                Restantes
              </label>
              <input
                id="debt-rem-inst"
                type="number"
                min="0"
                max="360"
                value={remainingInstallments}
                onChange={(e) => setRemainingInstallments(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 text-xs"
                required
              />
            </div>

            <div>
              <label htmlFor="debt-due-day" className="block font-semibold text-stone-700 mb-1">
                Dia Venc.
              </label>
              <input
                id="debt-due-day"
                type="number"
                min="1"
                max="31"
                value={dueDayOfMonth}
                onChange={(e) => setDueDayOfMonth(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 text-xs"
                required
              />
            </div>
          </div>

          {/* Taxa de Juros informada e percentual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="debt-interest-monthly" className="block font-semibold text-stone-700 mb-1">
                Juros Mensais (% a.m.)
              </label>
              <input
                id="debt-interest-monthly"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={interestRateMonthly}
                onChange={(e) => setInterestRateMonthly(e.target.value)}
                placeholder="Ex: 2.5"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 text-xs"
              />
              <span className="text-[10px] text-stone-700 mt-0.5 block">
                Usado para o plano de ataque anti-juros
              </span>
            </div>

            <div>
              <label htmlFor="debt-interest" className="block font-semibold text-stone-700 mb-1">
                Descrição da Taxa (opcional)
              </label>
              <input
                id="debt-interest"
                type="text"
                value={interestRateText}
                onChange={(e) => setInterestRateText(e.target.value)}
                placeholder="Ex: 1.99% a.m. ou Sem juros"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 text-xs"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label htmlFor="debt-notes" className="block font-semibold text-stone-700 mb-1">
              Observações (opcional)
            </label>
            <textarea
              id="debt-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Renegociação feita com desconto; débito automático..."
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 text-xs"
            />
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
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold shadow-xs transition-colors"
            >
              {editingDebt ? 'Salvar Alterações' : 'Cadastrar Dívida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
