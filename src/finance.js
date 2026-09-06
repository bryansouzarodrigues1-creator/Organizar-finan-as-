// Pure financial domain. Money is always an integer number of centavos.
export function money(value, signed = false) {
  const raw = String(value).trim();
  if (!(signed ? /^-?\d+(?:[,.]\d{1,2})?$/ : /^\d+(?:[,.]\d{1,2})?$/).test(raw)) throw Error('Use um valor como 1234,56, sem separador de milhar.');
  const negative = raw.startsWith('-');
  const [whole, fraction = ''] = raw.replace('-', '').split(/[,.]/);
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents > 100000000000) throw Error('Valor fora do limite permitido.');
  return negative ? -cents : cents;
}
export const brl = cents => new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'}).format(cents / 100);
export function validDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(date + 'T12:00:00Z');
  return !Number.isNaN(+parsed) && parsed.toISOString().slice(0,10) === date;
}
export const emptyState = () => ({version:1,opening:0,entries:[],debts:[]});
export function validate(state) {
  if (state?.version !== 1 || !Array.isArray(state.entries) || !Array.isArray(state.debts) || !Number.isSafeInteger(state.opening) || Math.abs(state.opening)>100000000000) throw Error('Dados inválidos.');
  const ids = new Set();
  for (const item of [...state.debts,...state.entries]) {
    if (typeof item.id !== 'string' || !item.id || ids.has(item.id)) throw Error('Identificador inválido ou repetido.');
    ids.add(item.id);
    if (typeof item.description !== 'string' || !item.description.trim() || item.description.length>120 || !Number.isSafeInteger(item.amount) || item.amount<=0 || item.amount>100000000000) throw Error('Confira descrição e valor.');
  }
  for (const e of state.entries) {
    if (!['income','expense'].includes(e.kind) || !validDate(e.due) || (e.paidOn !== null && !validDate(e.paidOn))) throw Error('Confira tipo e datas.');
    if (e.debtId !== null && (!state.debts.some(d=>d.id===e.debtId) || e.kind!=='expense')) throw Error('Dívida vinculada inválida.');
  }
  for (const d of state.debts) {
    const allocated = state.entries.filter(e=>e.debtId===d.id).reduce((a,e)=>a+e.amount,0);
    if (allocated>d.amount) throw Error('As parcelas vinculadas ultrapassam o total informado da dívida.');
  }
  return state;
}
export function saveEntry(state, entry) {
  return validate({...state,entries:[...state.entries.filter(e=>e.id!==entry.id),entry]});
}
export function saveDebt(state, debt) {
  return validate({...state,debts:[...state.debts.filter(d=>d.id!==debt.id),debt]});
}
export function settle(state, id, paidOn) {
  const entry=state.entries.find(e=>e.id===id);
  if (!entry) throw Error('Lançamento não encontrado.');
  // Repeated payment requests have no additional effect.
  return entry.paidOn ? state : saveEntry(state,{...entry,paidOn});
}
export function removeEntry(state,id) { return validate({...state,entries:state.entries.filter(e=>e.id!==id)}); }
export function removeDebt(state,id) {
  if (state.entries.some(e=>e.debtId===id)) throw Error('Remova ou desvincule os lançamentos desta dívida primeiro.');
  return validate({...state,debts:state.debts.filter(d=>d.id!==id)});
}
export function summary(state,today) {
  validate(state);
  if (!validDate(today)) throw Error('Data inválida.');
  const end = today.slice(0,7)+'-31';
  const direction = e=>e.kind==='income'?e.amount:-e.amount;
  const completed = state.entries.filter(e=>e.paidOn && e.paidOn<=today);
  const current = state.opening+completed.reduce((a,e)=>a+direction(e),0);
  const pending = state.entries.filter(e=>!e.paidOn && e.due<=end);
  const futureSettled = state.entries.filter(e=>e.paidOn && e.paidOn>today && e.paidOn<=end);
  const remainingDebt=state.debts.reduce((a,d)=>a+d.amount-state.entries.filter(e=>e.debtId===d.id && e.paidOn && e.paidOn<=today).reduce((a,e)=>a+e.amount,0),0);
  return {current,projected:current+[...pending,...futureSettled].reduce((a,e)=>a+direction(e),0),
    pendingIncome:pending.filter(e=>e.kind==='income').reduce((a,e)=>a+e.amount,0),
    pendingExpense:pending.filter(e=>e.kind==='expense').reduce((a,e)=>a+e.amount,0),remainingDebt,
    overdue:pending.filter(e=>e.kind==='expense' && e.due<today),
    unallocated:state.debts.reduce((a,d)=>a+d.amount-state.entries.filter(e=>e.debtId===d.id).reduce((a,e)=>a+e.amount,0),0)};
}
