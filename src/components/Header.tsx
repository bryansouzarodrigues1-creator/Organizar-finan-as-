import React, { useState } from 'react';
import {
  Wallet,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Building2
} from 'lucide-react';
import { FinancialProfile } from '../types';
import { formatCents } from '../utils/money';

interface HeaderProps {
  profile: FinancialProfile;
  selectedMonthYear: string; // 'YYYY-MM'
  onSelectMonthYear: (monthYear: string) => void;
  onOpenInitialBalanceModal: () => void;
  onOpenBankImportModal: () => void;
  onLoadSampleData: () => void;
  onResetData: () => void;
  onExportData: () => void;
  onImportData: (json: string) => boolean;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  selectedMonthYear,
  onSelectMonthYear,
  onOpenInitialBalanceModal,
  onOpenBankImportModal,
  onLoadSampleData,
  onResetData,
  onExportData,
  onImportData,
}) => {
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  // Formata o mês para exibição legível em português (ex: "Setembro de 2026")
  const [yearStr, monthStr] = selectedMonthYear.split('-');
  const dateObj = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
  const formattedMonth = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const capitalizedMonth = formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);

  const handlePrevMonth = () => {
    const d = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 2, 1);
    const newY = d.getFullYear();
    const newM = String(d.getMonth() + 1).padStart(2, '0');
    onSelectMonthYear(`${newY}-${newM}`);
  };

  const handleNextMonth = () => {
    const d = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 1);
    const newY = d.getFullYear();
    const newM = String(d.getMonth() + 1).padStart(2, '0');
    onSelectMonthYear(`${newY}-${newM}`);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    const newY = now.getFullYear();
    const newM = String(now.getMonth() + 1).padStart(2, '0');
    onSelectMonthYear(`${newY}-${newM}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = onImportData(content);
      if (!success) {
        setImportError('Arquivo JSON inválido. Verifique o arquivo de backup.');
        setTimeout(() => setImportError(null), 4000);
      } else {
        setShowDataMenu(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 sm:py-4">
          
          {/* Logo e Título do Produto */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                <Wallet className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-stone-900 tracking-tight">
                    Organizar Finanças
                  </h1>
                  <span className="hidden sm:inline-flex text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Dados neste dispositivo
                  </span>
                </div>
                <p className="text-xs text-stone-700">
                  Suas contas e dívidas, em um só lugar
                </p>
              </div>
            </div>

            {/* Menu de dados no mobile */}
            <div className="sm:hidden relative">
              <button
                type="button"
                id="mobile-data-menu-btn"
                onClick={() => setShowDataMenu(!showDataMenu)}
                className="p-2 text-stone-700 hover:text-stone-900 border border-stone-200 rounded-lg text-xs"
              >
                Gerenciar
              </button>
            </div>
          </div>

          {/* Navegação de Mês */}
          <div className="flex items-center justify-between sm:justify-center gap-2 bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              type="button"
              id="prev-month-btn"
              onClick={handlePrevMonth}
              title="Mês anterior"
              className="p-1.5 rounded-lg hover:bg-white text-stone-700 hover:text-stone-900 hover:shadow-2xs transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-2 text-sm font-semibold text-stone-800">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>{capitalizedMonth}</span>
            </div>

            <button
              type="button"
              id="next-month-btn"
              onClick={handleNextMonth}
              title="Próximo mês"
              className="p-1.5 rounded-lg hover:bg-white text-stone-700 hover:text-stone-900 hover:shadow-2xs transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              id="today-month-btn"
              onClick={handleCurrentMonth}
              className="text-xs px-2 py-1 text-emerald-800 hover:bg-white rounded-md font-medium transition-colors"
            >
              Hoje
            </button>
          </div>

          {/* Configuração de Saldo Inicial, Puxar do Banco e Opções de Dados */}
          <div className="hidden sm:flex items-center gap-2 relative">
            <button
              type="button"
              id="header-bank-import-btn"
              onClick={onOpenBankImportModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
              title="Puxar extrato bancário ou colar lançamentos sem digitar um por um"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Puxar do Banco</span>
            </button>

            <button
              type="button"
              id="config-initial-balance-btn"
              onClick={onOpenInitialBalanceModal}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-stone-800 bg-stone-50 hover:bg-stone-100 border border-stone-300 rounded-lg transition-colors"
              title="Configurar saldo inicial que você já possui em conta ou carteira"
            >
              <Wallet className="w-3.5 h-3.5 text-stone-500" />
              <span>Saldo Inicial: <strong>{formatCents(profile.initialBalanceInCents)}</strong></span>
            </button>

            {/* Menu suspenso de dados */}
            <div className="relative">
              <button
                type="button"
                id="desktop-data-menu-btn"
                onClick={() => setShowDataMenu(!showDataMenu)}
                className="px-3 py-2 text-xs font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors"
              >
                Opções de Dados
              </button>

              {showDataMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-stone-200 p-2 z-50 text-xs text-stone-700">
                  <div className="px-2 py-1.5 font-semibold text-stone-900 border-b border-stone-100 mb-1">
                    Persistência e Exemplos
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onLoadSampleData();
                      setShowDataMenu(false);
                    }}
                    className="w-full text-left px-2 py-2 hover:bg-emerald-50 text-emerald-900 rounded-md flex items-center gap-2 font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Carregar dados fictícios (Teste)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onExportData();
                      setShowDataMenu(false);
                    }}
                    className="w-full text-left px-2 py-2 hover:bg-stone-100 text-stone-700 rounded-md flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-stone-500" />
                    <span>Exportar backup (JSON)</span>
                  </button>

                  <label className="w-full text-left px-2 py-2 hover:bg-stone-100 text-stone-700 rounded-md flex items-center gap-2 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-stone-500" />
                    <span>Importar backup (JSON)</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="border-t border-stone-100 my-1 pt-1">
                    {confirmReset ? (
                      <div className="p-2 bg-red-50 rounded-md border border-red-200 text-xs space-y-1.5">
                        <span className="font-bold text-red-900 block text-[11px]">
                          Zerar todos os lançamentos?
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onResetData();
                              setConfirmReset(false);
                              setShowDataMenu(false);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-1 rounded text-[11px] cursor-pointer"
                          >
                            Sim, zerar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmReset(false)}
                            className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold px-2 py-1 rounded text-[11px] cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmReset(true)}
                        className="w-full text-left px-2 py-1.5 hover:bg-red-50 text-red-700 rounded-md flex items-center gap-2 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-red-500" />
                        <span>Limpar todos os dados</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notificação de importação */}
        {importError && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        {/* Menu móvel quando aberto */}
        {showDataMenu && (
          <div className="sm:hidden pb-3 pt-1 border-t border-stone-200 grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                onOpenBankImportModal();
                setShowDataMenu(false);
              }}
              className="p-2 bg-emerald-100 text-emerald-950 rounded-lg text-left font-bold col-span-2 flex items-center gap-2"
            >
              <Building2 className="w-4 h-4 text-emerald-800" />
              <span>Importar extrato (OFX / Pix)</span>
            </button>
            <button
              type="button"
              onClick={onOpenInitialBalanceModal}
              className="p-2 bg-stone-100 rounded-lg text-stone-800 text-left font-medium"
            >
              Saldo Inicial: {formatCents(profile.initialBalanceInCents)}
            </button>
            <button
              type="button"
              onClick={() => {
                onLoadSampleData();
                setShowDataMenu(false);
              }}
              className="p-2 bg-emerald-50 text-emerald-900 rounded-lg text-left font-medium"
            >
              Carregar dados fictícios
            </button>
            <button
              type="button"
              onClick={() => {
                onExportData();
                setShowDataMenu(false);
              }}
              className="p-2 bg-stone-100 rounded-lg text-stone-700 text-left"
            >
              Exportar backup
            </button>
            {confirmReset ? (
              <div className="p-2 bg-red-50 text-red-700 rounded-lg text-left col-span-2 space-y-1.5 border border-red-200">
                <span className="text-xs font-bold text-red-900 block">Zerar todos os dados?</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetData();
                      setConfirmReset(false);
                      setShowDataMenu(false);
                    }}
                    className="bg-red-600 text-white font-bold px-2 py-1 rounded text-xs"
                  >
                    Sim, zerar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="bg-stone-200 text-stone-700 font-semibold px-2 py-1 rounded text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="p-2 bg-red-50 text-red-700 rounded-lg text-left font-medium cursor-pointer"
              >
                Limpar dados
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
