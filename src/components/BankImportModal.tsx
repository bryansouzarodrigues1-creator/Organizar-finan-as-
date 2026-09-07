import { useState, useRef } from 'react';
import type { Transaction } from '../types';
import { parseOFX, parsePastedStatement } from '../utils/bankParser';
import { formatCents } from '../utils/money';
type Imported = Omit<Transaction, 'id' | 'createdAt'>;
interface Props { isOpen:boolean; onClose:()=>void; onImportTransactions:(transactions:Imported[])=>void; currentYear:string }
export function BankImportModal({isOpen,onClose,onImportTransactions,currentYear}:Props) {
  const [tab,setTab]=useState<'ofx'|'paste'|'openfinance'>('ofx');
  const [text,setText]=useState('');
  const [preview,setPreview]=useState<Imported[]>([]);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const request=useRef(0);
  const clear=()=>{request.current++;setPreview([]);setError('');setBusy(false);};
  const close=()=>{clear();setText('');onClose();};
  if(!isOpen)return null;
  return <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <section role="dialog" aria-modal="true" aria-labelledby="import-title" className="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4">
      <div className="flex justify-between gap-4"><h2 id="import-title" className="font-bold text-lg">Importar extrato</h2><button type="button" onClick={close} className="p-2">Fechar</button></div>
      <p className="text-sm">Importação manual. Nenhum banco está conectado. Confira datas, valores e categorias antes de confirmar.</p>
      <div className="flex flex-wrap gap-2">{(['ofx','paste','openfinance'] as const).map(t=><button type="button" key={t} aria-pressed={t===tab} className={`p-3 rounded border ${t===tab?'bg-stone-900 text-white':'bg-white'}`} onClick={()=>{clear();setTab(t);}}>{t==='ofx'?'Arquivo OFX':t==='paste'?'Colar texto':'Conexão bancária'}</button>)}</div>
      {tab==='ofx'&&<label className="block">Selecione o extrato OFX (até 5 MB)
        <input type="file" accept=".ofx" className="block mt-2 w-full" onChange={async e=>{
          clear();const file=e.target.files?.[0];if(!file)return;
          if(file.size>5*1024*1024){setError('Arquivo acima de 5 MB. Exporte um período menor.');return;}
          const id=++request.current;setBusy(true);
          try{const data=await file.text();if(id===request.current)setPreview(parseOFX(data));}
          catch(err){if(id===request.current)setError(err instanceof Error?err.message:'Erro ao ler arquivo.');}
          finally{if(id===request.current)setBusy(false);}
        }}/>
        <span className="block text-sm mt-2">A disponibilidade e o formato do OFX variam entre bancos. Arquivos sem conta, data ou valor válido são recusados.</span>
      </label>}
      {tab==='paste'&&<div className="space-y-3"><label className="block">Uma movimentação por linha, com data e valor em reais<textarea maxLength={100000} value={text} onChange={e=>{clear();setText(e.target.value);}} rows={5} className="block border rounded p-3 w-full" placeholder="06/09/2026 Pix enviado -50,00"/></label><button type="button" className="border rounded p-3" onClick={()=>{clear();try{setPreview(parsePastedStatement(text,currentYear));}catch(err){setError(err instanceof Error?err.message:'Texto inválido.');}}}>Conferir texto</button><p className="text-sm">Sem ano, usamos {currentYear}. A categoria é uma sugestão por palavras-chave. Valores sem indicação de entrada são tratados como saída; confira antes de importar.</p></div>}
      {tab==='openfinance'&&<div className="bg-amber-50 border border-amber-200 rounded p-4 space-y-2"><h3 className="font-bold">Conexão bancária ainda indisponível</h3><p>Não há autorização, sincronização ou acesso à sua conta bancária nesta versão. A integração depende de um provedor e de configuração no servidor.</p><p>Enquanto isso, use a importação manual. Nenhuma movimentação fictícia será adicionada por esta tela.</p></div>}
      {busy&&<p role="status">Lendo arquivo…</p>}
      {error&&<p role="alert" className="text-red-800">{error}</p>}
      {tab!=='openfinance'&&preview.length>0&&<div className="space-y-2"><p>{preview.length} lançamentos para conferir. Reimportações com a mesma identificação serão ignoradas.</p><p className="text-sm">Não misture OFX e texto do mesmo período: formatos diferentes ou registros antigos sem identificação podem exigir conferência manual. No texto, confira também movimentações idênticas de contas diferentes.</p><ul className="divide-y max-h-64 overflow-y-auto">{preview.map((t,i)=><li key={i} className="py-3"><strong>{t.description}</strong><p>{t.dueDate} · {t.category} · {t.type==='income'?'+':'−'}{formatCents(t.amountInCents)}</p></li>)}</ul></div>}
      <div className="flex justify-end gap-2"><button type="button" onClick={close} className="border rounded p-3">Cancelar</button><button type="button" disabled={tab==='openfinance'||!preview.length||busy} className="bg-stone-900 disabled:opacity-40 text-white rounded p-3" onClick={()=>{if(tab==='openfinance'||!preview.length||busy)return;onImportTransactions(preview);close();}}>Confirmar importação</button></div>
    </section>
  </div>;
}
