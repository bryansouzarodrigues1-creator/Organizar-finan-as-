import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  Building2,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Transaction } from '../types';
import { parseOFX, parsePastedStatement } from '../utils/bankParser';
import { formatCents } from '../utils/money';

interface BankImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTransactions: (transactions: Omit<Transaction, 'id' | 'createdAt'>[]) => void;
  currentYear: string;
}

export const BankImportModal: React.FC<BankImportModalProps> = ({
  isOpen,
  onClose,
  onImportTransactions,
  currentYear,
}) => {
  const [activeTab, setActiveTab] = useState<'ofx' | 'paste' | 'openfinance'>('ofx');

  // Estado para texto colado
  const [pastedText, setPastedText] = useState('');

  // Lançamentos interpretados para pré-visualização
  const [previewList, setPreviewList] = useState<Omit<Transaction, 'id' | 'createdAt'>[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  // Simulação de banco selecionado no Open Finance
  const [selectedBank, setSelectedBank] = useState<string>('Nubank');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseOFX(content);
        setPreviewList(parsed);
      }
    };
    reader.readAsText(file);
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;
    const parsed = parsePastedStatement(pastedText, currentYear);
    setPreviewList(parsed);
  };

  const handleOpenFinanceSimulate = (bankName: string) => {
    setSelectedBank(bankName);
    // Cria conjunto demonstrativo realista do extrato daquele banco
    const today = new Date().toISOString().slice(0, 10);
    const mockFromBank: Omit<Transaction, 'id' | 'createdAt'>[] = [
      {
        description: `Transferência Pix Recebida - Cliente (${bankName})`,
        amountInCents: 125000,
        type: 'income',
        status: 'completed',
        dueDate: today,
        paidDate: today,
        category: 'Freelance',
      },
      {
        description: `Supermercado Pão de Açúcar (${bankName} Débito)`,
        amountInCents: 21540,
        type: 'expense',
        status: 'completed',
        dueDate: today,
        paidDate: today,
        category: 'Alimentação',
      },
      {
        description: `Enel Distribuição Energia Elétrica (${bankName})`,
        amountInCents: 13580,
        type: 'expense',
        status: 'completed',
        dueDate: today,
        paidDate: today,
        category: 'Contas Fixas',
      },
      {
        description: `Posto Ipiranga Combustível (${bankName})`,
        amountInCents: 10000,
        type: 'expense',
        status: 'completed',
        dueDate: today,
        paidDate: today,
        category: 'Transporte',
      },
    ];

    setPreviewList(mockFromBank);
  };

  const handleConfirmImport = () => {
    if (previewList.length === 0) return;
    onImportTransactions(previewList);
    setPreviewList([]);
    setPastedText('');
    setFileName(null);
    onClose();
  };

  const totalIncomesInCents = previewList
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amountInCents, 0);

  const totalExpensesInCents = previewList
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amountInCents, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bank-import-modal-title"
        className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-stone-200 max-h-[90vh] flex flex-col"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 id="bank-import-modal-title" className="text-base font-bold text-stone-900">
                Puxar Gastos do Banco (Fricção Zero)
              </h2>
              <p className="text-xs text-stone-700">
                Importe os dados do seu banco sem precisar digitar conta por conta
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Seleção do Método */}
        <div className="flex border-b border-stone-200 mt-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('ofx')}
            className={`flex-1 py-2 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'ofx'
                ? 'border-emerald-700 text-emerald-950 font-bold'
                : 'border-transparent text-stone-700 hover:text-stone-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Extrato .OFX</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-2 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'paste'
                ? 'border-emerald-700 text-emerald-950 font-bold'
                : 'border-transparent text-stone-700 hover:text-stone-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Colar Linhas do App</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('openfinance')}
            className={`flex-1 py-2 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'openfinance'
                ? 'border-emerald-700 text-emerald-950 font-bold'
                : 'border-transparent text-stone-700 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Open Finance (Simulador)</span>
          </button>
        </div>

        {/* Conteúdo da Aba */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {activeTab === 'ofx' && (
            <div className="space-y-3">
              <p className="text-stone-700 leading-relaxed">
                Quase todo banco brasileiro (Nubank, Inter, Itaú, Bradesco, Santander, Caixa, C6) permite exportar o extrato no formato padrão <strong>.OFX</strong>. Basta baixar no app do banco e soltar aqui:
              </p>

              <label className="border-2 border-dashed border-stone-300 hover:border-emerald-600 bg-stone-50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                <Upload className="w-8 h-8 text-stone-400 mb-2" />
                <span className="font-bold text-stone-800">
                  {fileName ? fileName : 'Clique para selecionar seu arquivo .OFX'}
                </span>
                <span className="text-[11px] text-stone-700 mt-1">
                  Formatos suportados: .ofx (extrato bancário oficial)
                </span>
                <input
                  type="file"
                  accept=".ofx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-3">
              <p className="text-stone-700 leading-relaxed">
                Abra seu banco no celular, selecione e copie o extrato dos últimos dias (ou o comprovante de Pix) e cole abaixo:
              </p>
              <textarea
                rows={5}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Exemplo:&#10;12/09 Supermercado Extra R$ 180,45&#10;14/09 Pix recebido Salário +R$ 2.500,00&#10;15/09 Conta de Luz R$ 112,30"
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-900 font-mono text-xs"
              />
              <button
                type="button"
                onClick={handleParsePastedText}
                className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold transition-colors"
              >
                Interpretar Texto Colado
              </button>
            </div>
          )}

          {activeTab === 'openfinance' && (
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>Conexão Automática Open Finance</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Testar como a autorização bancária direta puxa os gastos e alimenta as fatias do app com 1 clique:
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['Nubank', 'Banco Inter', 'Itaú', 'Caixa'].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleOpenFinanceSimulate(b)}
                    className={`p-3 rounded-xl border font-bold text-center transition-all ${
                      selectedBank === b && previewList.length > 0
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500'
                        : 'border-stone-200 hover:border-stone-400 bg-white text-stone-800'
                    }`}
                  >
                    <Building2 className="w-4 h-4 mx-auto mb-1 text-stone-500" />
                    <span className="text-xs">{b}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pré-visualização dos Lançamentos Detectados */}
          {previewList.length > 0 && (
            <div className="border border-stone-200 rounded-xl p-3 bg-stone-50 space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {previewList.length} lançamentos detectados
                </span>
                <div className="flex items-center gap-2 text-[11px]">
                  {totalIncomesInCents > 0 && (
                    <span className="text-emerald-700 font-semibold">
                      +{formatCents(totalIncomesInCents)}
                    </span>
                  )}
                  {totalExpensesInCents > 0 && (
                    <span className="text-rose-700 font-semibold">
                      -{formatCents(totalExpensesInCents)}
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-40 overflow-y-auto divide-y divide-stone-200 border border-stone-200 rounded-lg bg-white">
                {previewList.map((tx, idx) => (
                  <div key={idx} className="p-2 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      {tx.type === 'income' ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                      )}
                      <div>
                        <span className="font-medium text-stone-900">{tx.description}</span>
                        <span className="text-stone-500 block text-[10px]">
                          {tx.category} • {tx.dueDate}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`font-bold ${
                        tx.type === 'income' ? 'text-emerald-700' : 'text-stone-900'
                      }`}
                    >
                      {formatCents(tx.amountInCents)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Ação */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-stone-600 hover:text-stone-900 font-semibold transition-colors text-xs"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={previewList.length === 0}
            onClick={handleConfirmImport}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors ${
              previewList.length > 0
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar e Alimentar as Fatias</span>
          </button>
        </div>
      </div>
    </div>
  );
};
