import React from 'react';
import {
  Banknote,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  CreditCard,
  Edit2
} from 'lucide-react';
import { FinancialSummaryCalculations } from '../types';
import { formatCents } from '../utils/money';

interface FinancialSummaryProps {
  summary: FinancialSummaryCalculations;
  selectedMonthName: string;
  onOpenInitialBalanceModal: () => void;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  summary,
  selectedMonthName,
  onOpenInitialBalanceModal,
}) => {
  const isBalanceNegative = summary.currentBalanceInCents < 0;
  const isProjectionNegative = summary.projectedAvailableInCents < 0;

  return (
    <section aria-label="Resumo Financeiro Principal" className="space-y-4">
      {/* Alertas de Dados Ausentes para transparência da Projeção */}
      {summary.missingDataWarnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Atenção para precisão da projeção:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-amber-800">
              {summary.missingDataWarnings.map((warn, idx) => (
                <li key={idx}>{warn}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Grid com os 3 Pilares Fundamentais do Produto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* PERGUNTA 1: Quanto dinheiro tenho agora? */}
        <div
          id="summary-card-current-balance"
          className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                1. Dinheiro em Caixa Hoje
              </span>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm text-stone-700">Saldo Atual Realizado</h2>
                <button
                  type="button"
                  onClick={onOpenInitialBalanceModal}
                  title="Ajustar saldo inicial de partida"
                  className="text-stone-500 hover:text-stone-800 p-0.5"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
              <Banknote className="w-5 h-5" />
            </div>
          </div>

          <div className="my-3">
            <div
              className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                isBalanceNegative ? 'text-red-600' : 'text-stone-900'
              }`}
            >
              {formatCents(summary.currentBalanceInCents)}
            </div>
            <p className="text-xs text-stone-700 mt-1">
              Dinheiro efetivamente disponível na conta agora.
            </p>
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-700">
            <span className="flex items-center gap-1 text-emerald-800">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Entradas: {formatCents(summary.totalIncomeCompletedInCents)}
            </span>
            <span className="flex items-center gap-1 text-rose-800">
              <ArrowDownRight className="w-3.5 h-3.5" />
              Saídas: {formatCents(summary.totalExpenseCompletedInCents)}
            </span>
          </div>
        </div>

        {/* PERGUNTA 2: Quais contas e dívidas vencem em seguida no mês? */}
        <div
          id="summary-card-commitments"
          className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                2. Compromissos a Pagar
              </span>
              <h2 className="text-sm text-stone-700">Pendências de {selectedMonthName}</h2>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              {formatCents(summary.pendingExpensesInCents + summary.debtInstallmentsPendingInCents)}
            </div>
            <p className="text-xs text-stone-700 mt-1">
              Total de contas e parcelas a vencer neste mês.
            </p>
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-700">
            <span>Contas a pagar: {formatCents(summary.pendingExpensesInCents)}</span>
            <span>Parcelas: {formatCents(summary.debtInstallmentsPendingInCents)}</span>
          </div>
        </div>

        {/* PERGUNTA 3: Quanto ficará disponível depois dos compromissos registrados? */}
        <div
          id="summary-card-projection"
          className={`rounded-2xl border p-5 shadow-xs flex flex-col justify-between ${
            isProjectionNegative
              ? 'bg-rose-50/70 border-rose-200'
              : 'bg-emerald-50/50 border-emerald-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isProjectionNegative ? 'bg-rose-600' : 'bg-emerald-600'
                  }`}
                ></span>
                3. Projeção de Sobra
              </span>
              <h2 className="text-sm text-stone-700">Saldo Previsto Final</h2>
            </div>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isProjectionNegative ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="my-3">
            <div
              className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                isProjectionNegative ? 'text-rose-700' : 'text-emerald-900'
              }`}
            >
              {formatCents(summary.projectedAvailableInCents)}
            </div>
            <p className="text-xs text-stone-700 mt-1">
              {isProjectionNegative
                ? 'Atenção: Os compromissos excedem as receitas previstas.'
                : 'Valor que restará livre após quitar todas as contas previstas.'}
            </p>
          </div>

          <div className="pt-3 border-t border-stone-200/60 text-xs text-stone-700 flex items-center justify-between">
            <span>Receitas previstas: +{formatCents(summary.pendingIncomeInCents)}</span>
            <span className="text-[11px] font-medium text-stone-600">
              {isProjectionNegative ? 'Déficit no mês' : 'Superávit no mês'}
            </span>
          </div>
        </div>
      </div>

      {/* Faixa Secundária: Distinção Clara do Saldo Devedor Acumulado (Regra: Distinguir saldo total da dívida de parcelas do mês) */}
      <div className="bg-stone-100/80 border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-stone-200 text-stone-700 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-900">
                Saldo Devedor Total Acumulado: {formatCents(summary.totalOutstandingDebtInCents)}
              </span>
              <span className="text-[11px] text-stone-700 bg-stone-200/80 px-2 py-0.5 rounded-md">
                Dívidas Totais Ativas
              </span>
            </div>
            <p className="text-stone-700 text-[11px] mt-0.5">
              Não confunda o montante total da dívida com as parcelas devidas neste mês ({formatCents(summary.debtInstallmentsPendingInCents)}).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <span className="inline-flex items-center gap-1 text-[11px] text-stone-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            Cálculos determinísticos
          </span>
        </div>
      </div>
    </section>
  );
};
