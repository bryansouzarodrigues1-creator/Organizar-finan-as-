import React from 'react';
import {
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from 'lucide-react';
import { FinancialSummaryCalculations, Transaction, Debt } from '../types';
import { formatCents } from '../utils/money';

interface MonthlyProjectionProps {
  summary: FinancialSummaryCalculations;
  transactions: Transaction[];
  debts: Debt[];
  selectedMonthYear: string;
  selectedMonthName: string;
}

export const MonthlyProjection: React.FC<MonthlyProjectionProps> = ({
  summary,
  transactions,
  debts,
  selectedMonthYear,
  selectedMonthName,
}) => {
  const pendingIncomes = transactions.filter(
    (t) => t.type === 'income' && t.status === 'pending' && t.dueDate.startsWith(selectedMonthYear)
  );

  const pendingExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.status === 'pending' && t.dueDate.startsWith(selectedMonthYear)
  );

  const pendingDebts = debts.filter((d) => {
    if (d.remainingInstallments <= 0) return false;
    const alreadyPaid =
      d.lastPaymentMonthYear === selectedMonthYear ||
      transactions.some(
        (t) =>
          t.debtId === d.id &&
          t.status === 'completed' &&
          t.dueDate.startsWith(selectedMonthYear)
      );
    return !alreadyPaid;
  });

  const isSurplus = summary.projectedAvailableInCents >= 0;

  const [selYear, selMonth] = selectedMonthYear.split('-').map(Number);
  const daysInSelectedMonth = new Date(selYear, selMonth, 0).getDate();

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">
              {summary.isPastMonth
                ? `Balanço Consolidado (${selectedMonthName})`
                : `Detalhamento da Projeção (${selectedMonthName})`}
            </h2>
            <p className="text-xs text-stone-700">
              {summary.isPastMonth
                ? 'Demonstrativo fechado das receitas e despesas realizadas no período'
                : 'Cálculo auditável do saldo disponível ao término do período'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stone-700 bg-stone-100 px-2.5 py-1 rounded-lg self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-stone-500" />
          <span>Período considerado: 01 a {daysInSelectedMonth} de {selectedMonthName}</span>
        </div>
      </div>

      {/* Tabela de Composição da Projeção */}
      <div className="space-y-3">
        
        {/* 1. Ponto de partida: Saldo Atual em Caixa */}
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <div className="font-semibold text-stone-900 flex items-center gap-1.5">
              <span>(1) Saldo Efetivo em Caixa Hoje</span>
            </div>
            <p className="text-stone-700 text-[11px]">
              Saldo inicial mais entradas já recebidas menos saídas já pagas
            </p>
          </div>
          <span className="font-bold text-sm text-stone-900">
            {formatCents(summary.currentBalanceInCents)}
          </span>
        </div>

        {/* 2. Mais: Receitas Previstas no mês */}
        <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="space-y-0.5">
            <div className="font-semibold text-emerald-950 flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              <span>(+) Receitas Previstas a Receber ({pendingIncomes.length} lançamento(s))</span>
            </div>
            <p className="text-emerald-800 text-[11px]">
              Valores a entrar no mês ({pendingIncomes.map((t) => t.description).join(', ') || 'Nenhuma prevista'})
            </p>
          </div>
          <span className="font-bold text-sm text-emerald-800">
            +{formatCents(summary.pendingIncomeInCents)}
          </span>
        </div>

        {/* 3. Menos: Despesas Pendentes no mês */}
        <div className="p-3 bg-rose-50/40 rounded-xl border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="space-y-0.5">
            <div className="font-semibold text-rose-950 flex items-center gap-1.5">
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
              <span>(-) Contas e Despesas a Pagar ({pendingExpenses.length} lançamento(s))</span>
            </div>
            <p className="text-rose-800 text-[11px]">
              Contas do mês pendentes ({pendingExpenses.map((t) => t.description).join(', ') || 'Nenhuma pendente'})
            </p>
          </div>
          <span className="font-bold text-sm text-rose-800">
            -{formatCents(summary.pendingExpensesInCents)}
          </span>
        </div>

        {/* 4. Menos: Parcelas de Dívidas a Vencer no mês */}
        <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="space-y-0.5">
            <div className="font-semibold text-amber-950 flex items-center gap-1.5">
              <ArrowDownRight className="w-4 h-4 text-amber-600" />
              <span>(-) Parcelas de Dívidas a Vencer ({pendingDebts.length} parcela(s))</span>
            </div>
            <p className="text-amber-800 text-[11px]">
              Parcelas que vencem no mês ({pendingDebts.map((d) => d.name).join(', ') || 'Nenhuma parcela pendente'})
            </p>
          </div>
          <span className="font-bold text-sm text-amber-800">
            -{formatCents(summary.debtInstallmentsPendingInCents)}
          </span>
        </div>

        {/* Linha Final: Resultado da Projeção */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            isSurplus ? 'bg-emerald-100/40 border-emerald-200 text-emerald-950' : 'bg-rose-100/40 border-rose-200 text-rose-950'
          }`}
        >
          <div>
            <div className="text-sm font-bold flex items-center gap-1.5">
              <span>(=) Projeção de Dinheiro Disponível ao Fim de {selectedMonthName}</span>
            </div>
            <p className="text-xs text-stone-700 mt-0.5">
              {isSurplus
                ? 'Saldo positivo projetado após quitar todos os compromissos cadastrados.'
                : 'Déficit projetado: faltarão recursos se todos os compromissos forem mantidos.'}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`text-xl font-extrabold ${
                isSurplus ? 'text-emerald-800' : 'text-rose-700'
              }`}
            >
              {formatCents(summary.projectedAvailableInCents)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
