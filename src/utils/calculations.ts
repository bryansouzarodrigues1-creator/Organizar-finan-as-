import { Transaction, Debt, FinancialProfile, FinancialSummaryCalculations } from '../types';
import { addCents } from './money';

export interface PendingCommitment {
  id: string;
  sourceType: 'expense' | 'debt_installment';
  title: string;
  amountInCents: number;
  dueDate: string; // YYYY-MM-DD
  isOverdue: boolean;
  daysRemaining: number;
  debtReferenceId?: string;
  category?: string;
}

/**
 * Calcula o saldo atual e as projeções determinísticas de acordo com as regras de produto.md
 */
export function calculateFinancialSummary(
  profile: FinancialProfile,
  transactions: Transaction[],
  debts: Debt[],
  selectedMonthYear: string // 'YYYY-MM'
): FinancialSummaryCalculations {
  // 1. Quanto dinheiro tenho agora? (Saldo Realizado em Caixa)
  // Saldo inicial + todas as receitas realizadas - todas as despesas realizadas até hoje
  const completedIncomes = transactions.filter(
    (t) => t.type === 'income' && t.status === 'completed'
  );
  const totalIncomeCompletedInCents = addCents(...completedIncomes.map((t) => t.amountInCents));

  const completedExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.status === 'completed'
  );
  const totalExpenseCompletedInCents = addCents(...completedExpenses.map((t) => t.amountInCents));

  const currentBalanceInCents = addCents(
    profile.initialBalanceInCents,
    totalIncomeCompletedInCents
  ) - totalExpenseCompletedInCents;

  // 2. Previsões e compromissos do mês selecionado
  const monthPendingIncomes = transactions.filter(
    (t) => t.type === 'income' && t.status === 'pending' && t.dueDate.startsWith(selectedMonthYear)
  );
  const pendingIncomeInCents = addCents(...monthPendingIncomes.map((t) => t.amountInCents));

  const monthPendingExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.status === 'pending' && t.dueDate.startsWith(selectedMonthYear)
  );
  const pendingExpensesInCents = addCents(...monthPendingExpenses.map((t) => t.amountInCents));

  // Parcelas de dívidas a vencer no mês que ainda NÃO foram pagas
  // Uma parcela é considerada pendente no mês se:
  // - A dívida tem remainingInstallments > 0
  // - Não houve pagamento registrado para esta dívida no mês selecionado
  let debtInstallmentsPendingInCents = 0;
  let hasPendingDebtsDueThisMonth = false;

  debts.forEach((debt) => {
    if (debt.remainingInstallments > 0) {
      // Verificar se já houve pagamento desta dívida no mês selecionado
      const alreadyPaidThisMonth =
        debt.lastPaymentMonthYear === selectedMonthYear ||
        transactions.some(
          (t) =>
            t.debtId === debt.id &&
            t.status === 'completed' &&
            t.dueDate.startsWith(selectedMonthYear)
        );

      if (!alreadyPaidThisMonth) {
        debtInstallmentsPendingInCents = addCents(
          debtInstallmentsPendingInCents,
          debt.installmentAmountInCents
        );
        hasPendingDebtsDueThisMonth = true;
      }
    }
  });

  // 3. Movimentações realizadas especificamente no mês selecionado
  const monthCompletedIncomes = transactions.filter(
    (t) => t.type === 'income' && t.status === 'completed' && t.dueDate.startsWith(selectedMonthYear)
  );
  const monthRealizedIncomeInCents = addCents(...monthCompletedIncomes.map((t) => t.amountInCents));

  const monthCompletedExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.status === 'completed' && t.dueDate.startsWith(selectedMonthYear)
  );
  const monthRealizedExpenseInCents = addCents(...monthCompletedExpenses.map((t) => t.amountInCents));

  // Balanço Líquido do mês: Total de receitas (recebidas + previstas) menos total de despesas (pagas + pendentes + parcelas)
  const totalMonthIncomeInCents = monthRealizedIncomeInCents + pendingIncomeInCents;
  const totalMonthExpenseInCents = monthRealizedExpenseInCents + pendingExpensesInCents + debtInstallmentsPendingInCents;
  const monthNetBalanceInCents = totalMonthIncomeInCents - totalMonthExpenseInCents;

  const currentMonthYear = new Date().toISOString().slice(0, 7);
  const isPastMonth = selectedMonthYear < currentMonthYear;
  const isFutureMonth = selectedMonthYear > currentMonthYear;

  // 4. Quanto ficará disponível depois dos compromissos registrados? (Projeção)
  // No mês atual ou futuro: Saldo Atual + Receitas Previstas no mês - Despesas Pendentes no mês - Parcelas a Vencer
  // Em meses já encerrados no passado: Balanço Líquido Realizado daquele mês
  const projectedAvailableInCents = isPastMonth
    ? monthNetBalanceInCents
    : currentBalanceInCents + pendingIncomeInCents - pendingExpensesInCents - debtInstallmentsPendingInCents;

  // Saldo total devedor (dívidas ativas acumuladas)
  const totalOutstandingDebtInCents = addCents(...debts.map((d) => d.totalDebtInCents));

  // Avisos de dados ausentes para projeção transparente
  const missingDataWarnings: string[] = [];

  if (profile.initialBalanceInCents === 0 && transactions.length === 0) {
    missingDataWarnings.push('Saldo inicial ainda não informado. Informe seu saldo atual em conta para calibrar o ponto de partida.');
  }

  if (pendingExpensesInCents > 0 && pendingIncomeInCents === 0 && currentBalanceInCents <= 0) {
    missingDataWarnings.push('Existem despesas previstas sem receitas cadastradas para o período.');
  }

  const debtsWithoutInterest = debts.filter((d) => !d.interestRateText || d.interestRateText.trim() === '');
  if (debtsWithoutInterest.length > 0) {
    missingDataWarnings.push(`${debtsWithoutInterest.length} dívida(s) cadastrada(s) sem taxa de juros informada.`);
  }

  return {
    currentBalanceInCents,
    totalIncomeCompletedInCents,
    totalExpenseCompletedInCents,
    monthRealizedIncomeInCents,
    monthRealizedExpenseInCents,
    monthNetBalanceInCents,
    pendingIncomeInCents,
    pendingExpensesInCents,
    debtInstallmentsPendingInCents,
    projectedAvailableInCents,
    isPastMonth,
    isFutureMonth,
    totalOutstandingDebtInCents,
    hasPendingDebtsDueThisMonth,
    missingDataWarnings,
  };
}

/**
 * Obtém todos os compromissos futuros ou vencidos ordenados por vencimento para o checklist rápido
 */
export function getUpcomingCommitments(
  transactions: Transaction[],
  debts: Debt[],
  selectedMonthYear: string
): PendingCommitment[] {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTime = new Date(todayStr + 'T00:00:00').getTime();

  const list: PendingCommitment[] = [];

  // Despesas pendentes do mês selecionado
  transactions
    .filter((t) => t.type === 'expense' && t.status === 'pending' && t.dueDate.startsWith(selectedMonthYear))
    .forEach((t) => {
      const dueDateTime = new Date(t.dueDate + 'T00:00:00').getTime();
      const diffDays = Math.ceil((dueDateTime - todayTime) / (1000 * 60 * 60 * 24));

      list.push({
        id: t.id,
        sourceType: 'expense',
        title: t.description,
        amountInCents: t.amountInCents,
        dueDate: t.dueDate,
        isOverdue: diffDays < 0,
        daysRemaining: diffDays,
        category: t.category,
      });
    });

  // Parcelas de dívidas pendentes no mês
  const [year, month] = selectedMonthYear.split('-');
  debts.forEach((debt) => {
    if (debt.remainingInstallments > 0) {
      const alreadyPaidThisMonth =
        debt.lastPaymentMonthYear === selectedMonthYear ||
        transactions.some(
          (t) =>
            t.debtId === debt.id &&
            t.status === 'completed' &&
            t.dueDate.startsWith(selectedMonthYear)
        );

      if (!alreadyPaidThisMonth) {
        // Monta a data de vencimento da parcela no mês (respeitando o dia do mês)
        const dueDayFormatted = String(Math.min(debt.dueDayOfMonth, 28)).padStart(2, '0');
        const dueDate = `${year}-${month}-${dueDayFormatted}`;
        const dueDateTime = new Date(dueDate + 'T00:00:00').getTime();
        const diffDays = Math.ceil((dueDateTime - todayTime) / (1000 * 60 * 60 * 24));

        list.push({
          id: `debt-pending-${debt.id}-${selectedMonthYear}`,
          sourceType: 'debt_installment',
          title: `Parcela: ${debt.name} (${debt.totalInstallments - debt.remainingInstallments + 1}/${debt.totalInstallments})`,
          amountInCents: debt.installmentAmountInCents,
          dueDate,
          isOverdue: diffDays < 0,
          daysRemaining: diffDays,
          debtReferenceId: debt.id,
          category: 'Dívidas / Parcelas',
        });
      }
    }
  });

  // Ordenar por data de vencimento (as mais próximas ou atrasadas primeiro)
  return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
