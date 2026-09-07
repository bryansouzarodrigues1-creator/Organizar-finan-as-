export type BankAccount = {id:string;name:string;type:'BANK'|'CREDIT';currencyCode:string};
export type BankMovement = {id:string;accountId:string;date:string;description:string;merchant:string|null;category:string;amountInCents:number;direction:'debit'|'credit';status:string};
export function validateMonth(month:unknown):string {
 if(typeof month!=='string'||!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))throw Error('Mês inválido.');
 return month;
}
export function assertItemOwner(item:{clientUserId?:string;connector?:{id:number;isOpenFinance?:boolean;isSandbox?:boolean}},userId:string,ids:number[],sandbox:boolean) {
 if(item.clientUserId!==userId)throw Error('Conexão não pertence ao usuário.');
 if(!item.connector||!ids.includes(item.connector.id)||!item.connector.isOpenFinance||Boolean(item.connector.isSandbox)!==sandbox)throw Error('Instituição não habilitada para este ambiente.');
}
export function normalizeMovement(raw:Record<string,unknown>,account:BankAccount):BankMovement {
 if(typeof raw.id!=='string'||typeof raw.date!=='string'||typeof raw.amount!=='number'||!Number.isFinite(raw.amount))throw Error('Movimentação inválida recebida do provedor.');
 const amount=Math.round(Math.abs(raw.amount)*100);
 if(!Number.isSafeInteger(amount))throw Error('Valor fora do limite.');
 const merchant=raw.merchant as {name?:unknown;businessName?:unknown}|undefined;
 const merchantName=typeof merchant?.name==='string'?merchant.name:typeof merchant?.businessName==='string'?merchant.businessName:null;
 return {id:raw.id,accountId:account.id,date:raw.date.slice(0,10),description:typeof raw.description==='string'?raw.description:'Descrição não informada',merchant:merchantName,category:typeof raw.category==='string'?raw.category:'Sem categoria',amountInCents:amount,direction:account.type==='CREDIT'?(raw.amount>=0?'debit':'credit'):(raw.amount<0?'debit':'credit'),status:typeof raw.status==='string'?raw.status:'UNKNOWN'};
}
export function nextCursor(next:unknown):string|null {
 if(!next)return null;
 if(typeof next!=='string'||!next.startsWith('?'))throw Error('Cursor inválido.');
 const after=new URLSearchParams(next.slice(1)).get('after');
 if(!after)throw Error('Cursor ausente.');
 return after;
}
export interface Transport { (path:string,init?:RequestInit):Promise<any> }
export async function collectAccount(call:Transport,account:BankAccount,month:string) {
 validateMonth(month);const [year,m]=month.split('-').map(Number);const last=new Date(Date.UTC(year,m,0)).getUTCDate();
 const rows=new Map<string,BankMovement>();const cursors=new Set<string>();let cursor:string|null=null;
 for(let page=0;page<20;page++) {
  const query=new URLSearchParams({accountId:account.id,dateFrom:month+'-01',dateTo:month+'-'+last});if(cursor)query.set('after',cursor);
  const response=await call('/v2/transactions?'+query);
  if(!Array.isArray(response.results))throw Error('Extrato inválido.');
  for(const raw of response.results){const row=normalizeMovement(raw,account);if(!row.date.startsWith(month))throw Error('Período inconsistente no extrato.');rows.set(row.id,row);}
  cursor=nextCursor(response.next);if(!cursor)return [...rows.values()];
  if(cursors.has(cursor))throw Error('Paginação repetida.');cursors.add(cursor);
 }
 throw Error('Extrato excedeu o limite do piloto. Nenhum resultado parcial foi salvo.');
}
export function hasActiveConsent(consents:unknown,now:number):boolean {
 if(!Array.isArray(consents))return false;
 return consents.some(c=>c&&c.revokedAt==null&&Array.isArray(c.products)&&c.products.includes('TRANSACTIONS')&&(c.expiresAt===null||(typeof c.expiresAt==='string'&&Date.parse(c.expiresAt)>now)));
}
