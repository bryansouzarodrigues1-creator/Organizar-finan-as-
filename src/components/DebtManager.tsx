import React from 'react';
import {
  CreditCard,
  Plus,
  CheckCircle,
  Edit2,
  Trash2,
  Check
} from 'lucide-react';
import { Debt, Transaction } from '../types';
import { formatCents } from '../utils/money';

interface DebtManagerProps {
  debts: Debt[];
  transactions: Transaction[];
  selectedMonthYear: string;
  selectedMonthName: string;
  onOpenNewDebt: () => void;
  onEditDebt: (debt: Debt) => void;
  onDeleteDebt: (id: string) => void;
  onPayInstallment: (debtId: string) => void;
}

export const DebtManager: React.FC<DebtManagerProps> = ({
  debts,
  transactions,
  selectedMonthYear,
  selectedMonthName,
  onOpenNewDebt,
  onEditDebt,
  onDeleteDebt,
  onPayInstallment,
}) => {
  const [deletingDebtId, setDeletingDebtId] = React.useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-stone-900">
            Organização de Dívidas e Empréstimos
          </h2>
          <p className="text-xs text-stone-700">
            Acompanhe o saldo devedor real, parcelas restantes e registre pagamentos sem duplicação
          </p>
        </div>

        <button
          type="button"
          id="add-debt-main-btn"
          onClick={onOpenNewDebt}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Dívida</span>
        </button>
      </div>

      {debts.length === 0 ? (
        <div className="text-center py-10 px-4 bg-stone-50 rounded-xl border border-dashed border-stone-200">
          <CreditCard className="w-8 h-8 text-stone-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-800">
            Nenhuma dívida registrada
          </p>
          <p className="text-xs text-stone-700 mt-1 max-w-sm mx-auto">
            Se você possui financiamentos, empréstimos ou faturas parceladas, cadastre-os aqui para prever as parcelas e acompanhar a quitação real.
          </p>
          <button
            type="button"
            onClick={onOpenNewDebt}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar primeira dívida</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {debts.map((debt) => {
            const isFinished = debt.remainingInstallments <= 0 || debt.totalDebtInCents <= 0;
            const paidCount = debt.totalInstallments - debt.remainingInstallments;
            const progressPercent = debt.totalInstallments > 0
              ? Math.min(100, Math.round((paidCount / debt.totalInstallments) * 100))
              : 100;

            // Verificar se a parcela de selectedMonthYear já foi paga
            const isPaidThisMonth =
              debt.lastPaymentMonthYear === selectedMonthYear ||
              transactions.some(
                (t) =>
                  t.debtId === debt.id &&
                  t.status === 'completed' &&
                  t.dueDate.startsWith(selectedMonthYear)
              );

            return (
              <div
                key={debt.id}
                className={`rounded-xl border p-4.5 flex flex-col justify-between transition-all ${
                  isFinished
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                        {debt.name}
                        {isFinished && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">
                            Quitada
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-stone-700 mt-0.5">
                        Vencimento todo dia {debt.dueDayOfMonth}
                        {debt.interestRateText && ` • Juros: ${debt.interestRateText}`}
                      </p>
                    </div>

                    {deletingDebtId === debt.id ? (
                      <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                        <span className="text-[10px] font-semibold text-red-700 px-1">Excluir?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteDebt(debt.id);
                            setDeletingDebtId(null);
                          }}
                          className="text-[10px] bg-red-600 hover:bg-red-700 text-white font-bold px-1.5 py-0.5 rounded cursor-pointer"
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingDebtId(null)}
                          className="text-[10px] bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold px-1.5 py-0.5 rounded cursor-pointer"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditDebt(debt)}
                          title="Editar dívida"
                          className="p-1.5 text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingDebtId(debt.id)}
                          title="Excluir dívida"
                          className="p-1.5 text-stone-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Informações Numéricas Centrais */}
                  <div className="grid grid-cols-2 gap-3 my-3.5 pt-3 border-t border-stone-100 text-xs">
                    <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                      <span className="text-stone-700 text-[11px] block">Saldo Devedor Total</span>
                      <span className="text-base font-bold text-stone-900">
                        {formatCents(debt.totalDebtInCents)}
                      </span>
                    </div>

                    <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                      <span className="text-stone-700 text-[11px] block">Valor da Parcela</span>
                      <span className="text-base font-bold text-stone-900">
                        {formatCents(debt.installmentAmountInCents)}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso das Parcelas */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-xs text-stone-700">
                      <span>
                        Parcelas: <strong>{paidCount}</strong> de <strong>{debt.totalInstallments}</strong> pagas
                      </span>
                      <span>{debt.remainingInstallments} restante(s)</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {debt.notes && (
                    <p className="text-xs text-stone-700 italic mb-3">
                      Obs: {debt.notes}
                    </p>
                  )}
                </div>

                {/* Ação de Pagamento Seguro da Parcela do Mês */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  {isFinished ? (
                    <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Dívida totalmente quitada!
                    </span>
                  ) : isPaidThisMonth ? (
                    <span className="text-xs text-emerald-800 font-medium flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Parcela de {selectedMonthName} já baixada
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onPayInstallment(debt.id)}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                      title="Registrar pagamento da parcela deste mês reduzindo o saldo disponível e amortizando a dívida"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Registrar pagamento da parcela ({formatCents(debt.installmentAmountInCents)})</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
