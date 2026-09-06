export type TransactionType = 'income' | 'expense';

export type TransactionStatus = 'completed' | 'pending';

export interface Transaction {
  id: string;
  description: string;
  amountInCents: number; // Armazenado sempre em centavos inteiros (ex: R$ 12,50 = 1250)
  type: TransactionType;
  status: TransactionStatus; // 'completed' = Realizada/Recebida/Paga; 'pending' = Prevista/A Pagar
  dueDate: string; // YYYY-MM-DD
  paidDate?: string; // YYYY-MM-DD se já realizada
  category: string;
  debtId?: string; // Vinculado a uma dívida específica se for parcela
  createdAt: string;
}

export interface Debt {
  id: string;
  name: string;
  totalDebtInCents: number; // Saldo devedor total em centavos
  installmentAmountInCents: number; // Valor de cada parcela em centavos
  totalInstallments: number; // Número total de parcelas
  remainingInstallments: number; // Parcelas restantes
  interestRateText?: string; // Taxa de juros informada (ex: "1.99% a.m." ou "Desconhecido")
  interestRateMonthly?: number; // Taxa mensal percentual numérica (ex: 2.5 para 2.5%)
  dueDayOfMonth: number; // Dia de vencimento no mês (1 a 31)
  notes?: string;
  lastPaymentMonthYear?: string; // Ex: '2026-09' para evitar pagamento duplo no mesmo mês
  createdAt: string;
}

export interface FinancialProfile {
  initialBalanceInCents: number; // Saldo inicial informado pelo usuário
  accountName?: string;
  updatedAt: string;
}

export interface AppData {
  version: number;
  profile: FinancialProfile;
  transactions: Transaction[];
  debts: Debt[];
}

export interface FinancialSummaryCalculations {
  // 1. Quanto dinheiro tenho agora?
  currentBalanceInCents: number; // Saldo inicial + receitas realizadas - despesas realizadas
  totalIncomeCompletedInCents: number;
  totalExpenseCompletedInCents: number;

  // 2. Compromissos e previsões do mês selecionado
  pendingIncomeInCents: number;
  pendingExpensesInCents: number;
  debtInstallmentsPendingInCents: number;

  // 3. Quanto ficará disponível depois dos compromissos registrados?
  projectedAvailableInCents: number; // currentBalance + pendingIncome - pendingExpenses - debtInstallmentsPending

  // Saldo devedor global
  totalOutstandingDebtInCents: number;

  // Indicadores de consistência
  hasPendingDebtsDueThisMonth: boolean;
  missingDataWarnings: string[];
}
