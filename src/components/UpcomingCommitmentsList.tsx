import React from 'react';
import {
  CalendarClock,
  CheckCircle,
  Receipt,
  CreditCard,
  Check
} from 'lucide-react';
import { PendingCommitment } from '../utils/calculations';
import { formatCents } from '../utils/money';

interface UpcomingCommitmentsListProps {
  commitments: PendingCommitment[];
  onPayExpense: (transactionId: string) => void;
  onPayDebtInstallment: (debtId: string) => void;
  onOpenNewTransaction: () => void;
}

export const UpcomingCommitmentsList: React.FC<UpcomingCommitmentsListProps> = ({
  commitments,
  onPayExpense,
  onPayDebtInstallment,
  onOpenNewTransaction,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <CalendarClock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">
              Próximos Vencimentos e Compromissos
            </h2>
            <p className="text-xs text-stone-700">
              Contas e parcelas ordenadas pela data de vencimento
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-stone-100 text-stone-700 rounded-full">
          {commitments.length} {commitments.length === 1 ? 'pendência' : 'pendências'}
        </span>
      </div>

      {commitments.length === 0 ? (
        <div className="text-center py-8 px-4 bg-stone-50/60 rounded-xl border border-dashed border-stone-200">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-2.5">
            <CheckCircle className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-stone-800">
            Nenhuma conta ou parcela pendente neste mês
          </p>
          <p className="text-xs text-stone-700 mt-1 max-w-sm mx-auto">
            Sem compromissos registrados para vencer neste período. Cadastre despesas ou dívidas para acompanhar seus pagamentos.
          </p>
          <button
            type="button"
            id="empty-state-add-expense-btn"
            onClick={onOpenNewTransaction}
            className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Cadastrar uma despesa
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {commitments.map((item) => {
            // Formata a data (YYYY-MM-DD -> DD/MM)
            const [, month, day] = item.dueDate.split('-');
            const formattedDate = `${day}/${month}`;

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  item.isOverdue
                    ? 'bg-rose-50/60 border-rose-200'
                    : 'bg-stone-50 hover:bg-stone-100/70 border-stone-200/80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      item.sourceType === 'debt_installment'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {item.sourceType === 'debt_installment' ? (
                      <CreditCard className="w-4 h-4" />
                    ) : (
                      <Receipt className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-sm text-stone-900">
                        {item.title}
                      </span>
                      {item.isOverdue ? (
                        <span className="text-[10px] font-bold uppercase bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                          Vencida há {Math.abs(item.daysRemaining)} dia(s)
                        </span>
                      ) : item.daysRemaining === 0 ? (
                        <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                          Vence hoje
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded">
                          Vence em {item.daysRemaining} dia(s)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-stone-700">
                      <span>Vencimento: {formattedDate}</span>
                      <span>•</span>
                      <span>{item.category || (item.sourceType === 'debt_installment' ? 'Dívida' : 'Despesa')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200/60">
                  <span className="text-sm font-bold text-stone-900">
                    {formatCents(item.amountInCents)}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (item.sourceType === 'expense') {
                        onPayExpense(item.id);
                      } else if (item.debtReferenceId) {
                        onPayDebtInstallment(item.debtReferenceId);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0"
                    title="Registrar pagamento desta pendência"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Dar baixa</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
