import type { AppData, Transaction } from '../types';
/** Replace/delete one transaction while reversing exactly its previous debt effect. */
export function changeTransaction(data: AppData, id: string, next?: Transaction): AppData {
  const old = data.transactions.find(t=>t.id===id);
  if (!old) return data;
  const transactions = next ? data.transactions.map(t=>t.id===id?next:t) : data.transactions.filter(t=>t.id!==id);
  const debts = data.debts.map(d=>{
    const reversed = old.debtId===d.id && old.status==='completed';
    const applied = next?.debtId===d.id && next.status==='completed';
    if (!reversed && !applied) return d;
    const balance = d.totalDebtInCents + (reversed?old.amountInCents:0) - (applied?next!.amountInCents:0);
    const paidMonths = transactions.filter(t=>t.debtId===d.id&&t.status==='completed').map(t=>t.dueDate.slice(0,7)).sort();
    return {...d,totalDebtInCents:Math.max(0,balance),remainingInstallments:Math.min(d.totalInstallments,Math.max(0,d.remainingInstallments+(reversed?1:0)-(applied?1:0))),lastPaymentMonthYear:paidMonths[paidMonths.length-1]};
  });
  return {...data,transactions,debts};
}
export function setTransactionPaid(data: AppData,id:string,paid:boolean,date:string):AppData {
  const old=data.transactions.find(t=>t.id===id);
  if(!old || (old.status==='completed')===paid) return data;
  return changeTransaction(data,id,{...old,status:paid?'completed':'pending',paidDate:paid?date:undefined});
}
export function payDebt(data:AppData,id:string,month:string,today:string):AppData {
  const debt=data.debts.find(d=>d.id===id);
  if(!debt||debt.remainingInstallments<=0||debt.totalDebtInCents<=0) return data;
  if(debt.lastPaymentMonthYear===month||data.transactions.some(t=>t.debtId===id&&t.status==='completed'&&t.dueDate.startsWith(month))) return data;
  const pending=data.transactions.find(t=>t.debtId===id&&t.status==='pending'&&t.dueDate.startsWith(month));
  if(pending) return setTransactionPaid(data,pending.id,true,today);
  const [y,m]=month.split('-').map(Number);
  const day=String(Math.min(debt.dueDayOfMonth,new Date(y,m,0).getDate())).padStart(2,'0');
  const amount=Math.min(debt.installmentAmountInCents,debt.totalDebtInCents);
  const tx:Transaction={id:crypto.randomUUID(),description:`Parcela de ${debt.name}`,amountInCents:amount,type:'expense',status:'pending',dueDate:`${month}-${day}`,category:'Dívidas / Parcelas',debtId:id,createdAt:new Date().toISOString()};
  return setTransactionPaid({...data,transactions:[tx,...data.transactions]},tx.id,true,today);
}
