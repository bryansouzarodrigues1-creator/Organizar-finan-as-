import { ArrowRight, MessageCircle, Plus, Receipt, CreditCard, Send, CalendarClock } from 'lucide-react';
import type { FinancialSummaryCalculations } from '../types';
import type { PendingCommitment } from '../utils/calculations';
import { formatCents } from '../utils/money';
interface ChatHomeProps {
  summary: FinancialSummaryCalculations;
  selectedMonthName: string;
  commitments: PendingCommitment[];
  onAddTransaction: () => void;
  onOpenDebts: () => void;
  onOpenAccounts: () => void;
  onOpenProjection: () => void;
  onEditBalance: () => void;
}
export function ChatHome({summary, selectedMonthName, commitments, onAddTransaction, onOpenDebts, onOpenAccounts, onOpenProjection, onEditBalance}: ChatHomeProps) {
  const pending = summary.pendingExpensesInCents + summary.debtInstallmentsPendingInCents;
  return <section className="chat-home space-y-5" aria-labelledby="conversation-heading">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" aria-label="Resumo financeiro registrado">
      <article className="rounded-2xl bg-emerald-950 text-white p-5">
        <p className="text-sm text-emerald-100">Saldo registrado</p>
        <p className="text-2xl font-bold mt-1 break-words">{formatCents(summary.currentBalanceInCents)}</p>
        <button type="button" className="mt-3 text-sm underline underline-offset-4 text-emerald-100" onClick={onEditBalance}>Conferir saldo inicial</button>
      </article>
      <article className="rounded-2xl border border-stone-200 bg-white p-5">
        <p className="text-sm text-stone-600">Compromissos do mês</p>
        <p className="text-2xl font-bold mt-1 break-words">{formatCents(pending)}</p>
        <button type="button" className="mt-3 text-sm underline underline-offset-4 text-emerald-800" onClick={onOpenAccounts}>Ver contas e parcelas</button>
      </article>
      <article className="rounded-2xl border border-stone-200 bg-white p-5">
        <p className="text-sm text-stone-600">Projeção de {selectedMonthName}</p>
        <p className={`text-2xl font-bold mt-1 break-words ${summary.projectedAvailableInCents < 0 ? 'text-red-700' : 'text-stone-900'}`}>{formatCents(summary.projectedAvailableInCents)}</p>
        <button type="button" className="mt-3 text-sm underline underline-offset-4 text-emerald-800" onClick={onOpenProjection}>Entender a projeção</button>
      </article>
    </div>
    <p className="text-sm text-stone-600">Valores dos seus registros, sem sincronização bancária. A projeção considera receitas previstas e compromissos do mês selecionado; não representa um limite seguro para gastar.</p>
    <div className="grid lg:grid-cols-[minmax(0,1fr)_19rem] gap-5 items-start">
      <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden min-w-0" aria-labelledby="conversation-heading">
        <div className="px-5 sm:px-7 py-5 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3"><MessageCircle aria-hidden="true" className="w-6 h-6 text-emerald-800"/><h2 id="conversation-heading" className="text-lg font-bold">Sua assistente financeira</h2></div>
          <span className="text-sm text-stone-600 bg-stone-100 rounded-full px-3 py-1">IA ainda não conectada</span>
        </div>
        <div className="px-5 sm:px-7 py-10 sm:py-14 flex flex-col justify-center min-h-64">
          <h3 className="text-2xl font-semibold tracking-tight max-w-md">Um espaço para conversar sobre seu dinheiro.</h3>
          <p className="mt-3 text-stone-600 max-w-lg">Aqui você poderá pedir ajuda e solicitar alterações nas suas contas. A conversa ainda não está disponível. Por enquanto, use os atalhos para organizar seus registros.</p>
          <div className="flex flex-wrap gap-2 mt-7" aria-label="Atalhos para as telas disponíveis">
            <button type="button" onClick={onAddTransaction} className="chat-shortcut"><Plus aria-hidden="true" className="w-4 h-4"/>Registrar um gasto</button>
            <button type="button" onClick={onOpenDebts} className="chat-shortcut"><CreditCard aria-hidden="true" className="w-4 h-4"/>Simular um pagamento</button>
            <button type="button" onClick={onOpenProjection} className="chat-shortcut"><Receipt aria-hidden="true" className="w-4 h-4"/>Entender minha situação</button>
          </div>
        </div>
        <div className="p-5 sm:p-7 pt-0">
          <label htmlFor="future-chat-message" className="block text-sm font-medium mb-2">Mensagem para a assistente</label>
          <div className="border border-stone-300 rounded-xl p-3 bg-stone-50">
            <textarea id="future-chat-message" disabled rows={2} aria-describedby="chat-unavailable" placeholder="A conversa estará disponível quando a IA for conectada." className="w-full resize-none bg-transparent text-stone-600 placeholder:text-stone-500 cursor-not-allowed text-base"/>
            <div className="flex justify-end"><button type="button" disabled className="inline-flex gap-2 items-center rounded-lg bg-stone-200 text-stone-500 py-2 px-4 cursor-not-allowed"><Send aria-hidden="true" className="w-4 h-4"/>Enviar</button></div>
          </div>
          <p id="chat-unavailable" className="text-sm text-stone-600 mt-2">Nenhuma mensagem será enviada ou alteração será feita por IA nesta etapa.</p>
        </div>
      </section>
      <aside className="space-y-4" aria-label="Acesso às contas">
        <section className="bg-white border border-stone-200 rounded-2xl p-5">
          <h3 className="font-semibold flex items-center gap-2"><CalendarClock aria-hidden="true" className="w-5 h-5 text-emerald-800"/>Pendências do mês</h3>
          {commitments.length === 0 ? <p className="text-sm text-stone-600 mt-4">Nenhuma pendência registrada neste período. Confira se todas as contas foram cadastradas.</p> : <ul className="divide-y divide-stone-100 mt-3">{commitments.slice(0,3).map(item=><li key={item.id} className="py-3"><p className="font-medium break-words">{item.title}</p><div className="text-sm text-stone-600 flex flex-wrap gap-x-3 mt-1"><span>{item.dueDate.split('-').reverse().join('/')}{item.isOverdue?' · Atrasado':''}</span><span className="font-semibold text-stone-900">{formatCents(item.amountInCents)}</span></div></li>)}</ul>}
          <button type="button" onClick={onOpenAccounts} className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-800 font-semibold py-2">Abrir contas <ArrowRight aria-hidden="true" className="w-4 h-4"/></button>
        </section>
        <section className="border border-emerald-200 bg-emerald-50 rounded-2xl p-5">
          <h3 className="font-semibold">Suas dívidas têm uma tela própria.</h3>
          <p className="text-sm text-stone-700 mt-2">Cadastre valores, confira parcelas e compare os cenários de pagamento.</p>
          <button type="button" onClick={onOpenDebts} className="mt-4 text-sm font-semibold text-emerald-900 underline underline-offset-4 py-2">Gerenciar dívidas</button>
        </section>
      </aside>
    </div>
  </section>;
}
