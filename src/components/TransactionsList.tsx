import React, { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  FileText
} from 'lucide-react';
import { Transaction, TransactionType, TransactionStatus } from '../types';
import { formatCents } from '../utils/money';

interface TransactionsListProps {
  transactions: Transaction[];
  selectedMonthYear: string;
  selectedMonthName: string;
  onOpenNewTransaction: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({
  transactions,
  selectedMonthYear,
  selectedMonthName,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onToggleStatus,
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TransactionStatus>('all');
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  // Filtrar pelo mês selecionado
  const monthTransactions = transactions.filter((t) => t.dueDate.startsWith(selectedMonthYear));

  const filteredTransactions = monthTransactions.filter((t) => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });

  // Ordenar por data
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    return b.dueDate.localeCompare(a.dueDate);
  });

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-stone-900">
            Movimentações de {selectedMonthName}
          </h2>
          <p className="text-xs text-stone-700">
            Receitas e despesas com vencimentos neste período
          </p>
        </div>

        <button
          type="button"
          id="add-transaction-main-btn"
          onClick={onOpenNewTransaction}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-stone-100/70 rounded-xl mb-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-stone-700 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-stone-600" />
            Tipo:
          </span>
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              typeFilter === 'all'
                ? 'bg-white text-stone-900 font-bold shadow-2xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('income')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              typeFilter === 'income'
                ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            Receitas
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('expense')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              typeFilter === 'expense'
                ? 'bg-white text-rose-800 font-bold shadow-2xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            Despesas
          </button>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-stone-700 font-medium mr-1">Situação:</span>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              statusFilter === 'all'
                ? 'bg-white text-stone-900 font-bold shadow-2xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              statusFilter === 'completed'
                ? 'bg-white text-stone-900 font-bold shadow-2xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            Realizadas
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              statusFilter === 'pending'
                ? 'bg-white text-stone-900 font-bold shadow-2xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            Pendentes
          </button>
        </div>
      </div>

      {/* Lista de Movimentações */}
      {sortedTransactions.length === 0 ? (
        <div className="text-center py-10 px-4 bg-stone-50 rounded-xl border border-dashed border-stone-200">
          <FileText className="w-8 h-8 text-stone-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-800">
            Nenhum lançamento encontrado para este período
          </p>
          <p className="text-xs text-stone-700 mt-1 max-w-sm mx-auto">
            Comece cadastrando suas receitas previstas ou despesas do mês para manter as contas organizadas.
          </p>
          <button
            type="button"
            onClick={onOpenNewTransaction}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar primeira conta</span>
          </button>
        </div>
      ) : (
        <div className="divide-y divide-stone-100">
          {sortedTransactions.map((tx) => {
            const isIncome = tx.type === 'income';
            const isCompleted = tx.status === 'completed';
            const [, month, day] = tx.dueDate.split('-');
            const formattedDate = `${day}/${month}`;

            return (
              <div
                key={tx.id}
                className="py-3 sm:px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-stone-50/80 rounded-xl transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isIncome
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-rose-600" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-stone-900">
                        {tx.description}
                      </span>
                      {tx.debtId && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                          Parcela Dívida
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-700 mt-0.5">
                      <span>Vencimento: {formattedDate}</span>
                      <span>•</span>
                      <span>{tx.category}</span>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => onToggleStatus(tx.id)}
                        className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                        }`}
                        title="Clique para alternar entre realizado e pendente"
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{isIncome ? 'Recebida' : 'Paga'}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{isIncome ? 'Prevista' : 'Pendente'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pl-12 sm:pl-0">
                  <span
                    className={`font-bold text-sm ${
                      isIncome ? 'text-emerald-800' : 'text-stone-900'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatCents(tx.amountInCents)}
                  </span>

                  {deletingTxId === tx.id ? (
                    <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                      <span className="text-[10px] font-semibold text-red-700 px-1">Excluir?</span>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteTransaction(tx.id);
                          setDeletingTxId(null);
                        }}
                        className="text-[10px] bg-red-600 hover:bg-red-700 text-white font-bold px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTxId(null)}
                        className="text-[10px] bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditTransaction(tx)}
                        title="Editar lançamento"
                        className="p-1.5 text-stone-700 hover:text-stone-900 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTxId(tx.id)}
                        title="Excluir lançamento"
                        className="p-1.5 text-stone-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
