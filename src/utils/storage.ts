import { AppData } from '../types';

const STORAGE_KEY = 'organizar_financas_app_data_v1';

export const defaultEmptyData: AppData = {
  version: 1,
  profile: {
    initialBalanceInCents: 0,
    accountName: 'Conta Principal',
    updatedAt: new Date().toISOString(),
  },
  transactions: [],
  debts: [],
};

// Dados fictícios de exemplo para validação e testes (conforme orientação do AGENTS.md)
export const mockSampleData: AppData = {
  version: 1,
  profile: {
    initialBalanceInCents: 185000, // R$ 1.850,00 saldo inicial em conta
    accountName: 'Conta Corrente Principal',
    updatedAt: new Date().toISOString(),
  },
  transactions: [
    {
      id: 'tx-sample-1',
      description: 'Salário Mensal (CLT)',
      amountInCents: 420000, // R$ 4.200,00
      type: 'income',
      status: 'completed', // Já recebido
      dueDate: new Date().toISOString().slice(0, 7) + '-05',
      paidDate: new Date().toISOString().slice(0, 7) + '-05',
      category: 'Salário',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-sample-2',
      description: 'Serviço Freelance de Design',
      amountInCents: 85000, // R$ 850,00
      type: 'income',
      status: 'pending', // Previsto a receber no mês
      dueDate: new Date().toISOString().slice(0, 7) + '-25',
      category: 'Freelance',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-sample-3',
      description: 'Aluguel e Condomínio',
      amountInCents: 145000, // R$ 1.450,00
      type: 'expense',
      status: 'completed', // Já pago
      dueDate: new Date().toISOString().slice(0, 7) + '-10',
      paidDate: new Date().toISOString().slice(0, 7) + '-10',
      category: 'Moradia',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-sample-4',
      description: 'Conta de Energia Elétrica',
      amountInCents: 21530, // R$ 215,30
      type: 'expense',
      status: 'pending', // A pagar
      dueDate: new Date().toISOString().slice(0, 7) + '-18',
      category: 'Contas Fixas',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-sample-5',
      description: 'Supermercado Mensal',
      amountInCents: 78040, // R$ 780,40
      type: 'expense',
      status: 'pending', // A pagar
      dueDate: new Date().toISOString().slice(0, 7) + '-22',
      category: 'Alimentação',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-sample-6',
      description: 'Internet Fibra',
      amountInCents: 11990, // R$ 119,90
      type: 'expense',
      status: 'pending', // A pagar
      dueDate: new Date().toISOString().slice(0, 7) + '-20',
      category: 'Serviços',
      createdAt: new Date().toISOString(),
    },
  ],
  debts: [
    {
      id: 'debt-sample-1',
      name: 'Empréstimo Pessoal (Reforma)',
      totalDebtInCents: 540000, // R$ 5.400,00 saldo devedor restante
      installmentAmountInCents: 45000, // R$ 450,00 parcela mensal
      totalInstallments: 18,
      remainingInstallments: 12,
      interestRateText: '2.5% a.m.',
      interestRateMonthly: 2.5,
      dueDayOfMonth: 15,
      notes: 'Parcela debitada no dia 15',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'debt-sample-2',
      name: 'Cartão de Crédito - Renegociação',
      totalDebtInCents: 180000, // R$ 1.800,00 saldo devedor
      installmentAmountInCents: 30000, // R$ 300,00 parcela mensal
      totalInstallments: 6,
      remainingInstallments: 6,
      interestRateText: '5.9% a.m.',
      interestRateMonthly: 5.9,
      dueDayOfMonth: 28,
      notes: 'Acordo quitando fatura parcelada',
      createdAt: new Date().toISOString(),
    },
  ],
};

export function loadStoredData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultEmptyData;
    }
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed || typeof parsed !== 'object' || !parsed.version) {
      return defaultEmptyData;
    }
    // Garantir integridade de arrays e campos
    return {
      version: parsed.version || 1,
      profile: {
        initialBalanceInCents: parsed.profile?.initialBalanceInCents ?? 0,
        accountName: parsed.profile?.accountName ?? 'Conta Principal',
        updatedAt: parsed.profile?.updatedAt ?? new Date().toISOString(),
      },
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      debts: Array.isArray(parsed.debts) ? parsed.debts : [],
    };
  } catch (err) {
    console.error('Erro ao ler dados persistidos do localStorage:', err);
    return defaultEmptyData;
  }
}

export function saveStoredData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Erro ao salvar dados no localStorage:', err);
  }
}

export function exportDataAsJson(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function importDataFromJson(jsonString: string): AppData | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      version: parsed.version || 1,
      profile: {
        initialBalanceInCents: Number(parsed.profile?.initialBalanceInCents) || 0,
        accountName: parsed.profile?.accountName || 'Conta Principal',
        updatedAt: new Date().toISOString(),
      },
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      debts: Array.isArray(parsed.debts) ? parsed.debts : [],
    };
  } catch (err) {
    console.error('JSON de importação inválido:', err);
    return null;
  }
}
