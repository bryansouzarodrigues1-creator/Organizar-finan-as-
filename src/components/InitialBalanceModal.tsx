import React, { useState, useEffect } from 'react';
import { X, Wallet, ShieldCheck } from 'lucide-react';
import { FinancialProfile } from '../types';
import { parseToCents, centsToInputValue, formatCents } from '../utils/money';

interface InitialBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: FinancialProfile;
  onSave: (newBalanceInCents: number, accountName: string) => void;
}

export const InitialBalanceModal: React.FC<InitialBalanceModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [balanceStr, setBalanceStr] = useState('');
  const [accountName, setAccountName] = useState('Conta Principal');

  useEffect(() => {
    setBalanceStr(centsToInputValue(profile.initialBalanceInCents));
    setAccountName(profile.accountName || 'Conta Principal');
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const balanceInCents = parseToCents(balanceStr);
    onSave(balanceInCents, accountName.trim() || 'Conta Principal');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="balance-modal-title"
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <h2 id="balance-modal-title" className="text-base font-bold text-stone-900">
              Saldo Inicial em Conta
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <p className="text-stone-700 leading-relaxed">
            Informe o valor que você possui hoje disponível em conta corrente, poupança ou dinheiro em espécie. Este valor servirá como ponto de partida exato para calcular seu saldo atual e as projeções.
          </p>

          <div>
            <label htmlFor="account-name" className="block font-semibold text-stone-700 mb-1">
              Identificação da Conta / Carteira
            </label>
            <input
              id="account-name"
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Ex: Nubank, Caixa, Carteira"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 text-xs"
              required
            />
          </div>

          <div>
            <label htmlFor="initial-balance-input" className="block font-semibold text-stone-700 mb-1">
              Saldo Inicial Atual (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-stone-700 font-semibold">R$</span>
              <input
                id="initial-balance-input"
                type="text"
                value={balanceStr}
                onChange={(e) => setBalanceStr(e.target.value)}
                placeholder="0,00"
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 text-xs font-semibold"
                required
              />
            </div>
            {balanceStr && (
              <span className="text-[11px] text-stone-700 mt-1 block">
                Valor interpretado: {formatCents(parseToCents(balanceStr))}
              </span>
            )}
          </div>

          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-[11px] text-stone-700 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>
              Regra de ouro: Receitas futuras previstas NÃO entram neste saldo até que sejam marcadas como recebidas.
            </span>
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-900 font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs transition-colors"
            >
              Salvar Saldo Inicial
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
