import React from 'react';
import {
  PieChart,
  Sparkles,
  Flame
} from 'lucide-react';
import { FinancialSummaryCalculations } from '../types';
import { formatCents } from '../utils/money';

interface RealMoneySliceBarProps {
  summary: FinancialSummaryCalculations;
  selectedMonthName: string;
  selectedMonthYear: string;
}

export const RealMoneySliceBar: React.FC<RealMoneySliceBarProps> = ({
  summary,
  selectedMonthName,
  selectedMonthYear,
}) => {
  const billsInCents = summary.pendingExpensesInCents;
  const debtsInCents = summary.debtInstallmentsPendingInCents;
  const freeMoneyInCents = summary.projectedAvailableInCents;

  const isDeficit = freeMoneyInCents < 0;

  // Cálculo proporcional apenas para desenhar as fatias visuais da barra (SEM mostrar porcentagens de texto)
  const totalAllocated = billsInCents + debtsInCents + (freeMoneyInCents > 0 ? freeMoneyInCents : 0);
  const denominator = totalAllocated > 0 ? totalAllocated : 1;

  const billsWidth = Math.min(100, Math.round((billsInCents / denominator) * 100));
  const debtsWidth = Math.min(100, Math.round((debtsInCents / denominator) * 100));
  const freeWidth = freeMoneyInCents > 0 ? Math.max(0, 100 - billsWidth - debtsWidth) : 0;

  // Dias restantes no mês para cálculo de gasto diário seguro
  const [selYear, selMonth] = selectedMonthYear.split('-').map(Number);
  const daysInSelectedMonth = new Date(selYear, selMonth, 0).getDate();

  const today = new Date();
  const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  let daysRemaining: number;
  let statusDayText = '';

  if (selectedMonthYear < currentMonthYear) {
    daysRemaining = 0;
    statusDayText = 'Mês encerrado';
  } else if (selectedMonthYear > currentMonthYear) {
    daysRemaining = daysInSelectedMonth;
    statusDayText = `Média para todos os ${daysInSelectedMonth} dias do mês`;
  } else {
    // Mês atual
    daysRemaining = Math.max(1, daysInSelectedMonth - today.getDate() + 1);
    statusDayText = `Restam ${daysRemaining} dias no mês`;
  }

  const safeDailySpendInCents = (!summary.isPastMonth && freeMoneyInCents > 0 && daysRemaining > 0)
    ? Math.floor(freeMoneyInCents / daysRemaining)
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-2xs">
            <PieChart className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              A Fatia Real do seu Dinheiro em {selectedMonthName}
              <span className="text-[11px] font-normal text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                Sem porcentagens chatas
              </span>
            </h2>
            <p className="text-xs text-stone-700">
              Para onde cada centavo do seu dinheiro já está destinado antes do mês acabar
            </p>
          </div>
        </div>

        {/* Termômetro de gasto seguro por dia ou status do mês */}
        {summary.isPastMonth ? (
          <div className="inline-flex items-center gap-2 bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-xl text-xs text-stone-700 font-medium self-start sm:self-auto">
            <span>Mês encerrado • Visualização histórica</span>
          </div>
        ) : !isDeficit && freeMoneyInCents > 0 ? (
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs text-emerald-950 font-medium self-start sm:self-auto">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Média projetada de <strong>{formatCents(safeDailySpendInCents)} por dia</strong> ({statusDayText})
            </span>
          </div>
        ) : isDeficit ? (
          <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl text-xs text-rose-950 font-medium self-start sm:self-auto">
            <Flame className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              Faltam <strong>{formatCents(Math.abs(freeMoneyInCents))}</strong> para fechar a conta do mês
            </span>
          </div>
        ) : null}
      </div>

      {/* A Barra de Fatias em Dinheiro Real */}
      <div className="space-y-1.5">
        <div className="w-full h-7 bg-stone-100 rounded-xl overflow-hidden flex p-1 gap-1 border border-stone-200">
          {/* Fatia 1: Boletos e Contas */}
          {billsInCents > 0 && (
            <div
              style={{ width: `${Math.max(8, billsWidth)}%` }}
              className="bg-amber-500 rounded-lg h-full flex items-center justify-center text-white text-[11px] font-bold px-1 overflow-hidden transition-all duration-300"
              title={`Boletos e Contas: ${formatCents(billsInCents)}`}
            >
              <span className="truncate">{formatCents(billsInCents)}</span>
            </div>
          )}

          {/* Fatia 2: Dívidas e Parcelas */}
          {debtsInCents > 0 && (
            <div
              style={{ width: `${Math.max(8, debtsWidth)}%` }}
              className="bg-rose-600 rounded-lg h-full flex items-center justify-center text-white text-[11px] font-bold px-1 overflow-hidden transition-all duration-300"
              title={`Parcelas de Dívidas: ${formatCents(debtsInCents)}`}
            >
              <span className="truncate">{formatCents(debtsInCents)}</span>
            </div>
          )}

          {/* Fatia 3: Dinheiro Projetado */}
          {freeMoneyInCents > 0 && (
            <div
              style={{ width: `${Math.max(8, freeWidth)}%` }}
              className="bg-emerald-600 rounded-lg h-full flex items-center justify-center text-white text-[11px] font-bold px-1 overflow-hidden transition-all duration-300"
              title={`Dinheiro Projetado: ${formatCents(freeMoneyInCents)}`}
            >
              <span className="truncate">{formatCents(freeMoneyInCents)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Os 3 Blocos de Dinheiro Real (Especificando em Reais, sem porcentagens) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Bloco 1 */}
        <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <span className="w-2.5 h-2.5 rounded-md bg-amber-500 shrink-0"></span>
            <span>Boletos & Contas do Mês</span>
          </div>
          <div className="text-xl font-extrabold text-stone-900 tracking-tight">
            {formatCents(billsInCents)}
          </div>
          <p className="text-[11px] text-stone-700">
            Dinheiro que já pertence à luz, água, aluguel e mercado.
          </p>
        </div>

        {/* Bloco 2 */}
        <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
            <span className="w-2.5 h-2.5 rounded-md bg-rose-600 shrink-0"></span>
            <span>Dívidas & Juros do Banco</span>
          </div>
          <div className="text-xl font-extrabold text-stone-900 tracking-tight">
            {formatCents(debtsInCents)}
          </div>
          <p className="text-[11px] text-stone-700">
            O pedaço que os bancos e financiamentos levam neste mês.
          </p>
        </div>

        {/* Bloco 3 */}
        <div
          className={`p-3.5 rounded-xl border space-y-1 ${
            isDeficit
              ? 'border-rose-300 bg-rose-100/50 text-rose-950'
              : 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span
              className={`w-2.5 h-2.5 rounded-md shrink-0 ${
                isDeficit ? 'bg-rose-600' : 'bg-emerald-600'
              }`}
            ></span>
            <span>{isDeficit ? 'Déficit / Falta Dinheiro' : 'Saldo projetado de Verdade'}</span>
          </div>
          <div
            className={`text-xl font-extrabold tracking-tight ${
              isDeficit ? 'text-rose-700' : 'text-emerald-900'
            }`}
          >
            {formatCents(freeMoneyInCents)}
          </div>
          <p className="text-[11px] text-stone-700">
            {isDeficit
              ? 'Você precisa cortar gastos ou conseguir renda extra para não dever.'
              : 'Esse é o valor real que você pode gastar sem medo de faltar no fim do mês.'}
          </p>
        </div>
      </div>
    </div>
  );
};
