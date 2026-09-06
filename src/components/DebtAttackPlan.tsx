import React, { useState, useMemo } from 'react';
import {
  Zap,
  TrendingDown,
  CheckCircle2,
  DollarSign,
  Flame,
  Award
} from 'lucide-react';
import { Debt } from '../types';
import { formatCents, addCents } from '../utils/money';

interface DebtAttackPlanProps {
  debts: Debt[];
  onPayInstallment: (debtId: string) => void;
  onAmortizeDebt?: (debtId: string, amountInCents: number) => void;
}

export const DebtAttackPlan: React.FC<DebtAttackPlanProps> = ({
  debts,
  onPayInstallment,
}) => {
  // Simulação de aporte extra mensal (em R$ inteiros, ex: 50, 100, 200)
  const [extraMonthlyContribution, setExtraMonthlyContribution] = useState<number>(50);

  // Ordenação estratégica de ataque:
  // 'interest' = Avalanche (maior juro primeiro para economizar mais dinheiro)
  // 'balance' = Bola de Neve (menor dívida primeiro para rápida vitória psicológica)
  const [strategy, setStrategy] = useState<'interest' | 'balance'>('interest');

  const activeDebts = useMemo(() => {
    return debts.filter((d) => d.remainingInstallments > 0 && d.totalDebtInCents > 0);
  }, [debts]);

  const sortedDebts = useMemo(() => {
    const list = [...activeDebts];
    if (strategy === 'interest') {
      return list.sort((a, b) => (b.interestRateMonthly || 0) - (a.interestRateMonthly || 0));
    } else {
      return list.sort((a, b) => a.totalDebtInCents - b.totalDebtInCents);
    }
  }, [activeDebts, strategy]);

  const totalActiveDebtInCents = useMemo(() => {
    return activeDebts.reduce((acc, d) => addCents(acc, d.totalDebtInCents), 0);
  }, [activeDebts]);

  const totalMonthlyInstallmentsInCents = useMemo(() => {
    return activeDebts.reduce((acc, d) => addCents(acc, d.installmentAmountInCents), 0);
  }, [activeDebts]);

  // Alvo prioritário número 1 do plano de ataque
  const primaryTarget = sortedDebts[0];

  // Cálculo de simulação de aceleração para a dívida prioritária
  const targetSimulation = useMemo(() => {
    if (!primaryTarget) return null;

    const extraCents = extraMonthlyContribution * 100;
    const currentInstallment = primaryTarget.installmentAmountInCents;
    const totalRemaining = primaryTarget.totalDebtInCents;
    const monthlyRate = (primaryTarget.interestRateMonthly || 2.5) / 100;

    // Meses normais restantes
    const normalMonths = primaryTarget.remainingInstallments;

    // Novo valor mensal aportado
    const acceleratedMonthly = currentInstallment + extraCents;

    // Estimativa de novos meses para quitação
    const acceleratedMonths = Math.max(
      1,
      Math.ceil(totalRemaining / (acceleratedMonthly > 0 ? acceleratedMonthly : 1))
    );

    const monthsSaved = Math.max(0, normalMonths - acceleratedMonths);

    // Economia estimada de juros em reais (R$)
    const interestSavedInCents = Math.round(
      monthsSaved * (totalRemaining * monthlyRate * 0.7)
    );

    return {
      monthsSaved,
      acceleratedMonths,
      interestSavedInCents: Math.max(0, interestSavedInCents),
    };
  }, [primaryTarget, extraMonthlyContribution]);

  if (activeDebts.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
          <Award className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-emerald-950">Você está livre de dívidas ativas!</h3>
        <p className="text-xs text-emerald-800 max-w-md mx-auto">
          Nenhuma parcela de financiamento, empréstimo ou cartão atrasado registrado. Continue protegendo seu dinheiro e gerando reserva.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-5">
      {/* Cabeçalho do Plano */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-900 text-white flex items-center justify-center">
            <Zap className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              Plano de Ataque às Dívidas
              <span className="text-[11px] font-normal text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
                Arma contra os juros
              </span>
            </h2>
            <p className="text-xs text-stone-700">
              Estratégia prática para antecipar quitações e economizar dinheiro que iria para o banco
            </p>
          </div>
        </div>

        {/* Alternador de Estratégia */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setStrategy('interest')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              strategy === 'interest'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
            title="Ataca a dívida com os juros mais caros primeiro (economiza o máximo de dinheiro)"
          >
            Maior Juro (Avalanche)
          </button>
          <button
            type="button"
            onClick={() => setStrategy('balance')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              strategy === 'balance'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
            title="Ataca a dívida de menor saldo primeiro (elimina um boleto da sua cabeça mais rápido)"
          >
            Menor Saldo (Bola de Neve)
          </button>
        </div>
      </div>

      {/* Resumo consolidado de dívidas */}
      <div className="grid grid-cols-2 gap-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs">
        <div>
          <span className="text-[11px] text-stone-700 block">Dívida Ativa Total Consolidada</span>
          <span className="text-sm font-extrabold text-stone-900">{formatCents(totalActiveDebtInCents)}</span>
        </div>
        <div>
          <span className="text-[11px] text-stone-700 block">Compromisso Mensal em Parcelas</span>
          <span className="text-sm font-extrabold text-rose-700">{formatCents(totalMonthlyInstallmentsInCents)}/mês</span>
        </div>
      </div>

      {/* Destaque: O Alvo Prioritário de Eliminação */}
      {primaryTarget && targetSimulation && (
        <div className="bg-gradient-to-br from-rose-950 to-stone-900 text-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-300">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                Alvo Prioritário de Ataque
              </div>
              <h3 className="text-lg font-extrabold text-white">{primaryTarget.name}</h3>
              <p className="text-xs text-stone-300">
                Saldo devedor: <strong>{formatCents(primaryTarget.totalDebtInCents)}</strong> • Parcela atual: {formatCents(primaryTarget.installmentAmountInCents)}/mês
                {primaryTarget.interestRateMonthly && ` • Juros de ${primaryTarget.interestRateMonthly}% ao mês`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onPayInstallment(primaryTarget.id)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors self-start sm:self-auto shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Dar Baixa na Parcela</span>
            </button>
          </div>

          {/* Simulador de Aceleração com Aporte Extra */}
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-4 border border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-stone-200">
                Simule colocar um valor extra por mês nesta dívida:
              </span>
              <div className="flex items-center gap-1.5">
                {[20, 50, 100, 200].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setExtraMonthlyContribution(val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      extraMonthlyContribution === val
                        ? 'bg-rose-500 text-white'
                        : 'bg-white/10 text-stone-300 hover:bg-white/20'
                    }`}
                  >
                    +R$ {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Resultado da Economia em Dinheiro Real (Sem porcentagem) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-stone-300">Tempo adiantado</div>
                  <div className="text-sm font-bold text-emerald-400">
                    {targetSimulation.monthsSaved > 0
                      ? `Quita ${targetSimulation.monthsSaved} meses antes!`
                      : 'Quitação no prazo normal'}
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-stone-300">Dinheiro salvo em juros</div>
                  <div className="text-sm font-bold text-amber-300">
                    {targetSimulation.interestSavedInCents > 0
                      ? `Economiza ~${formatCents(targetSimulation.interestSavedInCents)}`
                      : 'Elimina juros adicionais'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista das Dívidas Ordenadas por Estratégia */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
          Fila de Ataque ({activeDebts.length} dívidas ativas)
        </h4>
        <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
          {sortedDebts.map((debt, index) => {
            const isTarget = index === 0;
            return (
              <div
                key={debt.id}
                className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  isTarget ? 'bg-rose-50/40' : 'bg-white hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      isTarget
                        ? 'bg-rose-600 text-white'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-bold text-stone-900 flex items-center gap-2">
                      {debt.name}
                      {isTarget && (
                        <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded-sm uppercase font-bold">
                          Atacar Primeiro
                        </span>
                      )}
                    </div>
                    <div className="text-stone-700 text-[11px]">
                      Restam {debt.remainingInstallments} de {debt.totalInstallments} parcelas • Vence dia {debt.dueDayOfMonth}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <div className="font-extrabold text-stone-900">
                      {formatCents(debt.totalDebtInCents)}
                    </div>
                    <div className="text-stone-700 text-[11px]">
                      {formatCents(debt.installmentAmountInCents)}/mês
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onPayInstallment(debt.id)}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-lg text-xs transition-colors shrink-0"
                  >
                    Pagar Parcela
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
