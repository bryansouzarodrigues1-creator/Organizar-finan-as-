import {useEffect,useRef,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import {PluggyConnect} from 'react-pluggy-connect';
import {bankAuth,bankCall,bankConfigured} from '../utils/bankClient';
import {formatCents} from '../utils/money';
interface Connection {item_id:string;institution:string;sandbox:boolean}
interface Movement {id:string;accountId:string;date:string;description:string;merchant:string|null;category:string;amountInCents:number;direction:'debit'|'credit';status:string}
interface Snapshot {accounts:{id:string;name:string;type:'BANK'|'CREDIT';currencyCode:string}[];movements:Movement[];month:string;sandbox:boolean;syncedAt:string;bankUpdatedAt:string|null}
interface ConnectToken {accessToken:string;connectorIds:number[];sandbox:boolean}
export function BankConnections() {
 const [session,setSession]=useState<Session|null>(null);const sessionToken=useRef<string|null>(null);
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);const [accepted,setAccepted]=useState(false);
 const [connections,setConnections]=useState<Connection[]>([]);const [widget,setWidget]=useState<ConnectToken|null>(null);
 const [snapshot,setSnapshot]=useState<Snapshot|null>(null);const [accountId,setAccountId]=useState('');
 const [month,setMonth]=useState(new Date().toISOString().slice(0,7));const [confirmDisconnect,setConfirmDisconnect]=useState<string|null>(null);
 useEffect(()=>{if(!bankAuth)return;const {data:{subscription}}=bankAuth.auth.onAuthStateChange((_event,next)=>{sessionToken.current=next?.access_token||null;setSession(next);setSnapshot(null);setConnections([]);setWidget(null);setAccepted(false);});return()=>subscription.unsubscribe();},[]);
 async function call<T>(body:Record<string,unknown>){const token=sessionToken.current;if(!token)throw Error('Entre na sua conta.');const data=await bankCall<T>(token,body);if(sessionToken.current!==token)throw Error('Sessão alterada. Consulte novamente.');return data;}
 async function act(fn:()=>Promise<void>){setBusy(true);setMessage('');try{await fn();}catch(err){setMessage(err instanceof Error?err.message:'Não foi possível concluir.');}finally{setBusy(false);}}
 const refresh=async()=>{const result=await call<{connections:Connection[]}>({action:'list'});setConnections(result.connections);};
 const selected=snapshot?.accounts.find(a=>a.id===accountId);
 const rows=snapshot?.movements.filter(t=>t.accountId===accountId)||[];
 const groups=new Map<string,number>();for(const row of rows.filter(t=>t.direction==='debit'&&t.status==='POSTED'))groups.set(row.category,(groups.get(row.category)||0)+row.amountInCents);
 return <section className="space-y-5" aria-labelledby="banks-title">
  <h2 id="banks-title" className="text-xl font-bold">Bancos e gastos</h2>
  <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3">
   <p>Consulte movimentações e os estabelecimentos ou descrições informados pelo banco. O compartilhamento é para leitura; este aplicativo não faz Pix, transferências nem pagamentos bancários.</p>
   <p className="text-sm text-stone-600">A autorização acontece no fluxo do banco. Não digite sua senha bancária no cadastro deste aplicativo. Você pode revisar e revogar o consentimento no banco.</p>
   {!bankConfigured?<div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-2"><h3 className="font-semibold">Conexão ainda indisponível nesta versão</h3><p>A estrutura está preparada, mas faltam ativar o servidor, configurar o provedor e validar o compartilhamento em ambiente de teste. Nenhuma conta real está conectada.</p><button disabled className="px-4 py-2 border rounded opacity-50">Conectar banco</button></div>:!session?<form className="grid sm:grid-cols-2 gap-3" onSubmit={e=>{e.preventDefault();void act(async()=>{const {error}=await bankAuth!.auth.signInWithPassword({email,password});setPassword('');if(error)throw Error('Não foi possível entrar. Confira seus dados e a confirmação do e-mail.');});}}>
    <label className="text-sm">E-mail do aplicativo<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="block border rounded p-3 w-full"/></label>
    <label className="text-sm">Senha do aplicativo<input type="password" required minLength={8} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="block border rounded p-3 w-full"/></label>
    <button disabled={busy} className="bg-emerald-950 text-white rounded p-3">Entrar</button><button type="button" disabled={busy||password.length<8||!email} className="border rounded p-3" onClick={()=>void act(async()=>{const {error}=await bankAuth!.auth.signUp({email,password});setPassword('');if(error)throw Error('Não foi possível cadastrar. Confira o e-mail e a senha.');setMessage('Cadastro solicitado. Confirme seu e-mail antes de entrar, se necessário.');})}>Criar conta no aplicativo</button>
   </form>:<div className="space-y-3">
    <div className="flex flex-wrap gap-3 items-center"><span>Sessão iniciada.</span><button disabled={busy} className="underline" onClick={()=>void act(async()=>{sessionToken.current=null;setSnapshot(null);setConnections([]);setWidget(null);await bankAuth!.auth.signOut();setSession(null);})}>Sair e limpar consulta da tela</button></div>
    <p className="text-sm">Os cadastros manuais continuam salvos neste navegador e são separados desta consulta autenticada.</p>
    <label className="flex gap-2 items-start"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} className="mt-1"/>Quero iniciar o compartilhamento de contas e transações para consultar meus gastos. Vou conferir as permissões na autorização bancária.</label>
    <div className="flex flex-wrap gap-3"><button disabled={busy||!accepted} className="bg-emerald-950 text-white rounded p-3 disabled:opacity-40" onClick={()=>void act(async()=>setWidget(await call<ConnectToken>({action:'connect-token',accepted:true})))}>Escolher instituição</button><button disabled={busy} className="border rounded p-3" onClick={()=>void act(refresh)}>Ver minhas conexões</button></div>
    {widget&&<><p className="font-semibold">{widget.sandbox?'Ambiente de teste: use somente dados fictícios do provedor.':'Confira no banco quais dados serão compartilhados.'}</p><PluggyConnect connectToken={widget.accessToken} connectorIds={widget.connectorIds} includeSandbox={widget.sandbox} products={['ACCOUNTS','CREDIT_CARDS','TRANSACTIONS']} countries={['BR']} language="pt" onSuccess={({item})=>{setWidget(null);void act(async()=>{await call({action:'attach',itemId:item.id,accepted:true});await refresh();setMessage('Conexão registrada. Consulte o extrato quando o banco concluir a atualização.');});}} onClose={()=>setWidget(null)} onError={()=>{setWidget(null);setMessage('A autorização não foi concluída. Tente novamente; nenhuma conexão foi confirmada nesta tela.');}}/></>}
    <label className="block">Mês do extrato<input type="month" value={month} disabled={busy} onChange={e=>{setMonth(e.target.value);setSnapshot(null);}} className="block border p-2 rounded mt-1"/></label>
    <ul className="divide-y">{connections.map(c=><li key={c.item_id} className="py-3 flex flex-wrap items-center gap-3"><strong>{c.institution} {c.sandbox?'· Teste':''}</strong><button disabled={busy} className="border rounded p-2" onClick={()=>void act(async()=>{setSnapshot(null);const result=await call<Snapshot>({action:'snapshot',itemId:c.item_id,month});setSnapshot(result);setAccountId(result.accounts[0]?.id||'');})}>Consultar extrato disponível</button><button disabled={busy} className="underline" onClick={()=>setConfirmDisconnect(c.item_id)}>Desconectar</button>{confirmDisconnect===c.item_id&&<div><span>Remover esta conexão e os extratos salvos no aplicativo?</span><button disabled={busy} className="p-2 underline" onClick={()=>void act(async()=>{await call({action:'disconnect',itemId:c.item_id});setSnapshot(null);setConfirmDisconnect(null);await refresh();setMessage('Conexão removida. Confira também os consentimentos no aplicativo do banco.');})}>Confirmar</button><button className="p-2" onClick={()=>setConfirmDisconnect(null)}>Cancelar</button></div>}</li>)}</ul>
   </div>}
  </div>
  {busy&&<p role="status">Aguarde…</p>}{message&&<p role="status" className="bg-amber-50 border border-amber-200 p-4 rounded">{message}</p>}
  {snapshot&&<div className="space-y-4 bg-white border rounded-2xl p-5">
   <h3 className="font-bold">Extrato de {snapshot.month}{snapshot.sandbox?' · Dados de teste':''}</h3>
   <p className="text-sm">Consultado em {new Date(snapshot.syncedAt).toLocaleString('pt-BR')}. Atualização do banco: {snapshot.bankUpdatedAt?new Date(snapshot.bankUpdatedAt).toLocaleString('pt-BR'):'não informada'}. A consulta pode levar até 15 minutos para renovar os dados salvos e não força uma atualização instantânea no banco.</p>
   <label>Conta ou cartão<select value={accountId} onChange={e=>setAccountId(e.target.value)} className="block border rounded p-3 mt-1 max-w-full">{snapshot.accounts.map(a=><option key={a.id} value={a.id}>{a.name} · {a.type==='CREDIT'?'Cartão':'Conta'}</option>)}</select></label>
   <p className="text-sm">{selected?.type==='CREDIT'?'Compras e créditos do cartão, separados dos pagamentos da conta.':'Saídas e entradas desta conta. Transferências entre contas próprias podem aparecer como saídas.'} Estes registros não são somados automaticamente ao seu controle manual.</p>
   <h4 className="font-semibold">Débitos confirmados por categoria, em R$</h4>
   <ul className="grid sm:grid-cols-2 gap-2">{[...groups].map(([category,total])=><li key={category} className="border rounded p-3 flex justify-between gap-2"><span>{category}</span><strong>{formatCents(total)}</strong></li>)}</ul>
   <p className="text-sm">Categorias e estabelecimentos dependem do que o provedor informa. Uma descrição de Pix não identifica necessariamente uma loja. Créditos e estornos são mostrados separadamente; estes totais são débitos brutos, não gasto líquido.</p>
   <ul className="divide-y">{rows.map(t=><li key={t.id} className="py-3"><strong>{t.merchant||t.description}</strong>{t.merchant&&<p>{t.description}</p>}<p className="text-sm">{t.date} · {t.category} · {t.status==='POSTED'?'Confirmado':t.status==='PENDING'?'Pendente':'Status não informado'} · {t.direction==='debit'?'Débito':'Crédito'} {formatCents(t.amountInCents)}</p></li>)}</ul>
   {!rows.length&&<p>Nenhuma movimentação retornada para esta conta e período.</p>}
  </div>}
 </section>;
}
