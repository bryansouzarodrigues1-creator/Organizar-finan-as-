import {brl,money,summary,saveEntry,saveDebt,settle,removeEntry,removeDebt} from './finance.js';
import {load,persist,KEY} from './storage.js';
const $=s=>document.querySelector(s);
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const date=d=>d.split('-').reverse().join('/');
const field=(form,name)=>form.elements.namedItem(name);
const ef=$('#entry-form'),df=$('#debt-form');
let state,blocked=false;
const say=text=>{$('#feedback').textContent=text;};
const el=(tag,text,cls)=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
function button(label,handler){const b=el('button',label);b.type='button';b.onclick=()=>{try{handler();}catch(e){say(e.message);}};return b;}
function commit(next){if(blocked)throw Error('Recarregue a página antes de continuar.');persist(localStorage,next);state=next;render();say('Alteração salva neste navegador.');}
function resetEntry(){ef.reset();field(ef,'id').value='';field(ef,'due').value=today();field(ef,'paidOn').value=today();$('#paid-label').hidden=true;field(ef,'paidOn').required=false;$('#cancel-edit').hidden=true;$('#entry-heading').textContent='Novo lançamento';field(ef,'debtId').disabled=false;}
function resetDebt(){df.reset();field(df,'id').value='';$('#cancel-debt').hidden=true;}
function render(){
 const s=summary(state,today());$('#period').textContent=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(new Date());
 $('#opening').value=(state.opening/100).toFixed(2).replace('.',',');
 $('#summary').replaceChildren(...[['Saldo atual',s.current],['A pagar até o fim do mês',s.pendingExpense],['Projeção no fim do mês',s.projected],['Dívidas restantes',s.remainingDebt]].map(([label,value])=>{const c=el('article','','card');c.append(el('span',label),el('strong',brl(value),value<0?'negative':''));return c;}));
 $('#projection-note').textContent=`Projeção: saldo atual + ${brl(s.pendingIncome)} em receitas pendentes − ${brl(s.pendingExpense)} em despesas pendentes. Inclui atrasados e somente compromissos registrados até o fim deste mês. Receitas previstas podem não se confirmar.`;
 $('#debt-note').hidden=!s.unallocated;$('#debt-note').textContent=`Há ${brl(s.unallocated)} de dívidas sem parcelas cadastradas. Esse valor ainda não entra na projeção do mês. Cadastre os vencimentos para completar o resumo.`;
 const selected=field(ef,'debtId').value;$('#debt-select').replaceChildren(new Option('Nenhuma',''),...state.debts.map(d=>new Option(d.description,d.id)));field(ef,'debtId').value=selected;
 const filter=$('#filter').value;
 const entries=state.entries.filter(e=>filter==='all'||(filter==='pending'?!e.paidOn:!!e.paidOn)).sort((a,b)=>a.due.localeCompare(b.due));
 $('#entries').replaceChildren(...entries.map(e=>{
   const row=el('article','','record'),title=el('div','','record-title');title.append(el('strong',e.description),el('strong',(e.kind==='income'?'+ ':'− ')+brl(e.amount)));row.append(title);
   const debt=state.debts.find(d=>d.id===e.debtId);
   row.append(el('p',`${e.kind==='income'?'Receita':'Despesa'} · ${e.paidOn?'Concluído em '+date(e.paidOn):(e.due<today()?'Atrasado · ':'Pendente · ')+date(e.due)}${debt?' · '+debt.description:''}`,'meta'));
   const actions=el('div','','actions');
   if(!e.paidOn)actions.append(button(e.kind==='income'?'Recebi hoje':'Paguei hoje',()=>commit(settle(state,e.id,today()))));
   actions.append(button('Editar',()=>{for(const key of ['id','description','kind','due','debtId'])field(ef,key).value=e[key]??'';field(ef,'amount').value=(e.amount/100).toFixed(2).replace('.',',');field(ef,'paid').checked=!!e.paidOn;field(ef,'paidOn').value=e.paidOn||today();$('#paid-label').hidden=!e.paidOn;field(ef,'debtId').disabled=e.kind==='income';$('#entry-heading').textContent='Editar lançamento';$('#cancel-edit').hidden=false;field(ef,'description').focus();}));
   actions.append(button('Excluir',()=>{if(confirm('Excluir este lançamento? Se estiver pago, o saldo e a dívida serão recalculados.')){commit(removeEntry(state,e.id));if(field(ef,'id').value===e.id)resetEntry();}}));row.append(actions);return row;
 }));if(!entries.length)$('#entries').append(el('p','Nenhum lançamento nesta lista. Cadastre suas receitas e contas para começar.','empty'));
 $('#debts').replaceChildren(...state.debts.map(d=>{const row=el('article','','record');const paid=state.entries.filter(e=>e.debtId===d.id&&e.paidOn&&e.paidOn<=today()).reduce((a,e)=>a+e.amount,0);row.append(el('strong',d.description),el('p',`${brl(d.amount-paid)} restantes · ${brl(paid)} pagos · total acordado ${brl(d.amount)}`,'meta'));const actions=el('div','','actions');actions.append(button('Editar',()=>{field(df,'id').value=d.id;field(df,'description').value=d.description;field(df,'amount').value=(d.amount/100).toFixed(2).replace('.',',');$('#cancel-debt').hidden=false;field(df,'description').focus();}),button('Excluir',()=>{if(confirm('Excluir esta dívida?')){commit(removeDebt(state,d.id));if(field(df,'id').value===d.id)resetDebt();}}));row.append(actions);return row;}));if(!state.debts.length)$('#debts').append(el('p','Nenhuma dívida cadastrada.','empty'));
}
function submit(form,handler){form.onsubmit=e=>{e.preventDefault();try{handler();}catch(err){say(err.message);}};}
submit($('#opening-form'),()=>commit({...state,opening:money($('#opening').value,true)}));
submit(ef,()=>{const get=n=>field(ef,n).value;const paidOn=field(ef,'paid').checked?get('paidOn'):null;if(paidOn&&paidOn>today())throw Error('Um pagamento realizado não pode ter data futura.');commit(saveEntry(state,{id:get('id')||crypto.randomUUID(),description:get('description').trim(),kind:get('kind'),amount:money(get('amount')),due:get('due'),debtId:get('kind')==='income'?null:get('debtId')||null,paidOn}));resetEntry();});
submit(df,()=>{commit(saveDebt(state,{id:field(df,'id').value||crypto.randomUUID(),description:field(df,'description').value.trim(),amount:money(field(df,'amount').value)}));resetDebt();});
field(ef,'paid').onchange=()=>{$('#paid-label').hidden=!field(ef,'paid').checked;field(ef,'paidOn').required=field(ef,'paid').checked;};
field(ef,'kind').onchange=()=>{const income=field(ef,'kind').value==='income';field(ef,'debtId').disabled=income;if(income)field(ef,'debtId').value='';};
$('#cancel-edit').onclick=resetEntry;$('#cancel-debt').onclick=resetDebt;$('#filter').onchange=render;
window.addEventListener('storage',e=>{if(e.key===KEY||e.key===null){blocked=true;say('Os dados mudaram em outra aba. Recarregue esta página antes de continuar para evitar sobrescrever alterações.');document.querySelectorAll('button').forEach(b=>b.disabled=true);}});
try{state=load(localStorage);render();resetEntry();}catch(e){blocked=true;say('Não foi possível abrir os dados locais. Nenhum registro foi apagado. Verifique as permissões de armazenamento do navegador ou peça ajuda para recuperar os dados.');document.querySelectorAll('button').forEach(b=>b.disabled=true);}
