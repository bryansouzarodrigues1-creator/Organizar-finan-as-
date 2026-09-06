import { useState, useEffect, useMemo } from 'react';
import {
  CalendarClock,
  Calculator,
  Receipt,
  CheckCircle2,
  Zap,
  Building2
} from 'lucide-react';
import {
  AppData,
  Transaction,
  Debt,
  TransactionStatus
} from './types';
import {
  loadStoredData,
  saveStoredData,
  mockSampleData,
  defaultEmptyData,
  exportDataAsJson,
  importDataFromJson
} from './utils/storage';
import {
  calculateFinancialSummary,
  getUpcomingCommitments
} from './utils/calculations';
import { Header } from './components/Header';
import { FinancialSummary } from './components/FinancialSummary';
import { RealMoneySliceBar } from './components/RealMoneySliceBar';
import { DebtAttackPlan } from './components/DebtAttackPlan';
import { UpcomingCommitmentsList } from './components/UpcomingCommitmentsList';
import { MonthlyProjection } from './components/MonthlyProjection';
import { TransactionsList } from './components/TransactionsList';
import { DebtManager } from './components/DebtManager';
import { TransactionFormModal } from './components/TransactionFormModal';
import { DebtFormModal } from './components/DebtFormModal';
import { InitialBalanceModal } from './components/InitialBalanceModal';
import { BankImportModal } from './components/BankImportModal';

export function App() {
  // Inicialização de estado persistido
  const [data, setData] = useState<AppData>(() => loadStoredData());

  // Mês selecionado no formato 'YYYY-MM' (inicia no mês atual)
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(() => {
    return new Date().toISOString().slice(0, 7);
  });

  // Aba ativa para navegação fluida em telas menores
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'debts' | 'projection'>('overview');

  // Modais de controle
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isBankImportModalOpen, setIsBankImportModalOpen] = useState(false);

  // Mensagem toast de feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleImportBankTransactions = (
    newTransactions: Omit<Transaction, 'id' | 'createdAt'>[],
    skippedCount: number = 0
  ) => {
    const created: Transaction[] = newTransactions.map((tx, idx) => ({
      ...tx,
      id: `tx-bank-${Date.now()}-${idx}`,
      createdAt: new Date().toISOString(),
    }));

    setData((prev) => ({
      ...prev,
      transactions: [...created, ...prev.transactions],
    }));

    if (skippedCount > 0) {
      showToast(
        `${created.length} lançamentos importados com sucesso (${skippedCount} duplicados ignorados)!`
      );
    } else {
      showToast(`${created.length} lançamentos bancários importados e fatias atualizadas!`);
    }
  };

  // Salvar automaticamente no localStorage sempre que os dados mudarem
  useEffect(() => {
    saveStoredData(data);
  }, [data]);

  // Formata o nome do mês selecionado para a interface (ex: "Setembro de 2026")
  const selectedMonthName = useMemo(() => {
    const [yearStr, monthStr] = selectedMonthYear.split('-');
    const dateObj = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
    const str = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, [selectedMonthYear]);

  // Cálculos financeiros determinísticos baseados em centavos
  const financialSummary = useMemo(() => {
    return calculateFinancialSummary(
      data.profile,
      data.transactions,
      data.debts,
      selectedMonthYear
    );
  }, [data, selectedMonthYear]);

  // Compromissos pendentes e vencimentos
  const upcomingCommitments = useMemo(() => {
    return getUpcomingCommitments(
      data.transactions,
      data.debts,
      selectedMonthYear
    );
  }, [data.transactions, data.debts, selectedMonthYear]);

  // ==========================================
  // HANDLERS DE TRANSAÇÕES
  // ==========================================

  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'>,
    id?: string
  ) => {
    setData((prev) => {
      if (id) {
        // Edição
        const updated = prev.transactions.map((t) =>
          t.id === id ? { ...t, ...txData } : t
        );
        return { ...prev, transactions: updated };
      } else {
        // Criação
        const newTx: Transaction = {
          ...txData,
          id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          createdAt: new Date().toISOString(),
        };
        return { ...prev, transactions: [newTx, ...prev.transactions] };
      }
    });
    showToast(id ? 'Lançamento atualizado com sucesso.' : 'Novo lançamento cadastrado com sucesso.');
  };

  const handleDeleteTransaction = (id: string) => {
    setData((prev) => {
      const txToDelete = prev.transactions.find((t) => t.id === id);
      let updatedDebts = prev.debts;

      // Se a movimentação for o pagamento de uma parcela de dívida, restaura a parcela e o saldo devedor
      if (txToDelete?.debtId && txToDelete.status === 'completed') {
        updatedDebts = prev.debts.map((d) => {
          if (d.id === txToDelete.debtId) {
            return {
              ...d,
              remainingInstallments: Math.min(d.totalInstallments, d.remainingInstallments + 1),
              totalDebtInCents: d.totalDebtInCents + txToDelete.amountInCents,
            };
          }
          return d;
        });
      }

      return {
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== id),
        debts: updatedDebts,
      };
    });
    showToast('Lançamento excluído e totais recalculados.');
  };

  const handleToggleTransactionStatus = (id: string) => {
    setData((prev) => {
      const tx = prev.transactions.find((t) => t.id === id);
      if (!tx) return prev;

      const newStatus: TransactionStatus =
        tx.status === 'completed' ? 'pending' : 'completed';

      let updatedDebts = prev.debts;

      // Sincronização com o saldo devedor se for parcela de dívida
      if (tx.debtId) {
        if (newStatus === 'pending' && tx.status === 'completed') {
          // Reverte pagamento: devolve parcela e recompõe dívida
          updatedDebts = prev.debts.map((d) => {
            if (d.id === tx.debtId) {
              return {
                ...d,
                remainingInstallments: Math.min(d.totalInstallments, d.remainingInstallments + 1),
                totalDebtInCents: d.totalDebtInCents + tx.amountInCents,
              };
            }
            return d;
          });
        } else if (newStatus === 'completed' && tx.status === 'pending') {
          // Confirma pagamento: consome parcela e amortiza dívida
          updatedDebts = prev.debts.map((d) => {
            if (d.id === tx.debtId) {
              return {
                ...d,
                remainingInstallments: Math.max(0, d.remainingInstallments - 1),
                totalDebtInCents: Math.max(0, d.totalDebtInCents - tx.amountInCents),
              };
            }
            return d;
          });
        }
      }

      const updated = prev.transactions.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            status: newStatus,
            paidDate: newStatus === 'completed' ? new Date().toISOString().slice(0, 10) : undefined,
          };
        }
        return t;
      });

      return {
        ...prev,
        transactions: updated,
        debts: updatedDebts,
      };
    });
    showToast('Situação da movimentação atualizada.');
  };

  const handlePayExpense = (id: string) => {
    handleToggleTransactionStatus(id);
    showToast('Pagamento de conta registrado e saldo em caixa atualizado.');
  };

  // ==========================================
  // HANDLERS DE DÍVIDAS (Com garantia de não-duplicação)
  // ==========================================

  const handleSaveDebt = (debtData: Omit<Debt, 'id' | 'createdAt'>, id?: string) => {
    setData((prev) => {
      if (id) {
        const updated = prev.debts.map((d) => (d.id === id ? { ...d, ...debtData } : d));
        return { ...prev, debts: updated };
      } else {
        const newDebt: Debt = {
          ...debtData,
          id: 'debt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          createdAt: new Date().toISOString(),
        };
        return { ...prev, debts: [...prev.debts, newDebt] };
      }
    });
    showToast(id ? 'Dívida atualizada.' : 'Dívida cadastrada com sucesso.');
  };

  const handleDeleteDebt = (id: string) => {
    setData((prev) => ({
      ...prev,
      debts: prev.debts.filter((d) => d.id !== id),
    }));
    showToast('Dívida excluída.');
  };

  /**
   * Registra o pagamento da parcela de uma dívida garantindo:
   * 1. Redução do saldo disponível em caixa (via despesa realizada).
   * 2. Amortização no saldo devedor total da dívida.
   * 3. Redução em 1 das parcelas restantes.
   * 4. Bloqueio de cobrança duplicada da mesma parcela neste mês.
   */
  const handlePayDebtInstallment = (debtId: string) => {
    const debt = data.debts.find((d) => d.id === debtId);
    if (!debt) return;

    if (debt.remainingInstallments <= 0) {
      showToast('Esta dívida já está quitada.');
      return;
    }

    // Verificar se já existe pagamento registrado desta parcela no mês selecionado
    const alreadyPaid =
      debt.lastPaymentMonthYear === selectedMonthYear ||
      data.transactions.some(
        (t) =>
          t.debtId === debt.id &&
          t.status === 'completed' &&
          t.dueDate.startsWith(selectedMonthYear)
      );

    if (alreadyPaid) {
      showToast(`A parcela de ${selectedMonthName} desta dívida já foi baixada anteriormente.`);
      return;
    }

    const todayDate = new Date().toISOString().slice(0, 10);
    const [year, month] = selectedMonthYear.split('-');
    const dueDayFormatted = String(Math.min(debt.dueDayOfMonth, 28)).padStart(2, '0');
    const installmentDueDate = `${year}-${month}-${dueDayFormatted}`;

    const paidInstallmentNumber = debt.totalInstallments - debt.remainingInstallments + 1;

    // Criar despesa realizada correspondente à parcela
    const paymentTransaction: Transaction = {
      id: 'tx-debt-pay-' + Date.now(),
      description: `Pagamento Parcela ${paidInstallmentNumber}/${debt.totalInstallments} - ${debt.name}`,
      amountInCents: debt.installmentAmountInCents,
      type: 'expense',
      status: 'completed',
      dueDate: installmentDueDate,
      paidDate: todayDate,
      category: 'Dívidas / Parcelas',
      debtId: debt.id,
      createdAt: new Date().toISOString(),
    };

    // Atualizar a dívida (amortiza saldo devedor e reduz parcela restante)
    const newRemainingInstallments = Math.max(0, debt.remainingInstallments - 1);
    const newTotalDebtInCents = Math.max(0, debt.totalDebtInCents - debt.installmentAmountInCents);

    setData((prev) => ({
      ...prev,
      transactions: [paymentTransaction, ...prev.transactions],
      debts: prev.debts.map((d) => {
        if (d.id === debtId) {
          return {
            ...d,
            remainingInstallments: newRemainingInstallments,
            totalDebtInCents: newTotalDebtInCents,
            lastPaymentMonthYear: selectedMonthYear,
          };
        }
        return d;
      }),
    }));

    showToast(
      `Parcela ${paidInstallmentNumber} de "${debt.name}" paga com sucesso! Saldo e dívida atualizados.`
    );
  };

  // ==========================================
  // HANDLERS DO PERFIL E SALDO INICIAL
  // ==========================================

  const handleSaveInitialBalance = (initialBalanceInCents: number, accountName: string) => {
    setData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        initialBalanceInCents,
        accountName,
        updatedAt: new Date().toISOString(),
      },
    }));
    showToast('Saldo inicial configurado com sucesso.');
  };

  // ==========================================
  // DADOS DE TESTE, EXPORTAÇÃO E RESET
  // ==========================================

  const handleLoadSampleData = () => {
    setData(mockSampleData);
    showToast('Dados fictícios de demonstração carregados.');
  };

  const handleResetData = () => {
    setData(defaultEmptyData);
    showToast('Todos os registros foram zerados.');
  };

  const handleExportData = () => {
    const jsonString = exportDataAsJson(data);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `organizar_financas_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Arquivo de backup exportado.');
  };

  const handleImportData = (jsonString: string): boolean => {
    const imported = importDataFromJson(jsonString);
    if (!imported) return false;
    setData(imported);
    showToast('Backup importado com sucesso.');
    return true;
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      {/* Cabeçalho Superior */}
      <Header
        profile={data.profile}
        selectedMonthYear={selectedMonthYear}
        onSelectMonthYear={setSelectedMonthYear}
        onOpenInitialBalanceModal={() => setIsBalanceModalOpen(true)}
        onOpenBankImportModal={() => setIsBankImportModalOpen(true)}
        onLoadSampleData={handleLoadSampleData}
        onResetData={handleResetData}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />

      {/* Notificação Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Resumo Financeiro Superior (Os 3 Pilares Fundamentais do Produto) */}
        <FinancialSummary
          summary={financialSummary}
          selectedMonthName={selectedMonthName}
          onOpenInitialBalanceModal={() => setIsBalanceModalOpen(true)}
        />

        {/* A Fatia do Dinheiro em Reais (Adeus porcentagens, valores reais de sobra e compromissos) */}
        <RealMoneySliceBar
          summary={financialSummary}
          selectedMonthName={selectedMonthName}
          selectedMonthYear={selectedMonthYear}
        />

        {/* Barra de Navegação de Abas */}
        <div className="flex items-center justify-between border-b border-stone-200">
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-1 text-xs sm:text-sm font-semibold">
            <button
              type="button"
              id="tab-overview"
              onClick={() => setActiveTab('overview')}
              className={`pb-2.5 px-2.5 sm:px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-emerald-700 text-emerald-950 font-bold'
                  : 'border-transparent text-stone-700 hover:text-stone-900 hover:border-stone-300'
              }`}
            >
              <CalendarClock className="w-4 h-4" />
              <span>Visão Geral & Vencimentos</span>
              {upcomingCommitments.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[11px] rounded-full">
                  {upcomingCommitments.length}
                </span>
              )}
            </button>

            <button
              type="button"
              id="tab-debts"
              onClick={() => setActiveTab('debts')}
              className={`pb-2.5 px-2.5 sm:px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'debts'
                  ? 'border-emerald-700 text-emerald-950 font-bold'
                  : 'border-transparent text-stone-700 hover:text-stone-900 hover:border-stone-300'
              }`}
            >
              <Zap className="w-4 h-4 text-rose-600" />
              <span>Plano Anti-Juros & Dívidas</span>
              <span className="ml-1 px-1.5 py-0.2 bg-stone-100 text-stone-700 text-[11px] rounded-full">
                {data.debts.length}
              </span>
            </button>

            <button
              type="button"
              id="tab-transactions"
              onClick={() => setActiveTab('transactions')}
              className={`pb-2.5 px-2.5 sm:px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'transactions'
                  ? 'border-emerald-700 text-emerald-950 font-bold'
                  : 'border-transparent text-stone-700 hover:text-stone-900 hover:border-stone-300'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Movimentações</span>
              <span className="ml-1 px-1.5 py-0.2 bg-stone-100 text-stone-700 text-[11px] rounded-full">
                {data.transactions.length}
              </span>
            </button>

            <button
              type="button"
              id="tab-projection"
              onClick={() => setActiveTab('projection')}
              className={`pb-2.5 px-2.5 sm:px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'projection'
                  ? 'border-emerald-700 text-emerald-950 font-bold'
                  : 'border-transparent text-stone-700 hover:text-stone-900 hover:border-stone-300'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Detalhamento da Projeção</span>
            </button>
          </nav>
        </div>

        {/* Conteúdo da Aba Ativa */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <UpcomingCommitmentsList
              commitments={upcomingCommitments}
              onPayExpense={handlePayExpense}
              onPayDebtInstallment={handlePayDebtInstallment}
              onOpenNewTransaction={() => {
                setEditingTransaction(null);
                setIsTxModalOpen(true);
              }}
            />

            <MonthlyProjection
              summary={financialSummary}
              transactions={data.transactions}
              debts={data.debts}
              selectedMonthYear={selectedMonthYear}
              selectedMonthName={selectedMonthName}
            />
          </div>
        )}

        {activeTab === 'debts' && (
          <div className="space-y-6">
            {/* O Plano de Ataque às Dívidas e Simulador de Economia de Juros */}
            <DebtAttackPlan
              debts={data.debts}
              onPayInstallment={handlePayDebtInstallment}
            />

            {/* Cadastro e Gestão de Dívidas */}
            <DebtManager
              debts={data.debts}
              transactions={data.transactions}
              selectedMonthYear={selectedMonthYear}
              selectedMonthName={selectedMonthName}
              onOpenNewDebt={() => {
                setEditingDebt(null);
                setIsDebtModalOpen(true);
              }}
              onEditDebt={(debt) => {
                setEditingDebt(debt);
                setIsDebtModalOpen(true);
              }}
              onDeleteDebt={handleDeleteDebt}
              onPayInstallment={handlePayDebtInstallment}
            />
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-4">
            {/* Barra de atalhos rápidos com Puxar do Banco */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">
                    Cansado de preencher gasto por gasto?
                  </h4>
                  <p className="text-[11px] text-emerald-800">
                    Importe seu extrato .OFX ou cole os comprovantes de Pix/cartão direto do celular.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBankImportModalOpen(true)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Puxar Gastos do Banco</span>
              </button>
            </div>

            <TransactionsList
              transactions={data.transactions}
              selectedMonthYear={selectedMonthYear}
              selectedMonthName={selectedMonthName}
              onOpenNewTransaction={() => {
                setEditingTransaction(null);
                setIsTxModalOpen(true);
              }}
              onEditTransaction={(tx) => {
                setEditingTransaction(tx);
                setIsTxModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
              onToggleStatus={handleToggleTransactionStatus}
            />
          </div>
        )}

        {activeTab === 'projection' && (
          <MonthlyProjection
            summary={financialSummary}
            transactions={data.transactions}
            debts={data.debts}
            selectedMonthYear={selectedMonthYear}
            selectedMonthName={selectedMonthName}
          />
        )}
      </main>

      {/* Rodapé institucional transparente com diretrizes */}
      <footer className="bg-white border-t border-stone-200 mt-auto py-5 text-center text-xs text-stone-700">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            <strong>Organizar Finanças</strong> • Cálculos em centavos inteiros • Dados salvos no seu dispositivo
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLoadSampleData}
              className="text-emerald-800 hover:text-emerald-950 font-medium underline"
            >
              Testar com dados fictícios
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={handleExportData}
              className="text-stone-700 hover:text-stone-900 underline"
            >
              Fazer backup dos registros
            </button>
          </div>
        </div>
      </footer>

      {/* Modais do Sistema */}
      <TransactionFormModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        editingTransaction={editingTransaction}
        defaultMonthYear={selectedMonthYear}
      />

      <DebtFormModal
        isOpen={isDebtModalOpen}
        onClose={() => {
          setIsDebtModalOpen(false);
          setEditingDebt(null);
        }}
        onSave={handleSaveDebt}
        editingDebt={editingDebt}
      />

      <InitialBalanceModal
        isOpen={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        profile={data.profile}
        onSave={handleSaveInitialBalance}
      />

      <BankImportModal
        isOpen={isBankImportModalOpen}
        onClose={() => setIsBankImportModalOpen(false)}
        onImportTransactions={handleImportBankTransactions}
        currentYear={selectedMonthYear.slice(0, 4)}
        existingTransactions={data.transactions}
      />
    </div>
  );
}

export default App;
