/** Fixed monthly rate, month-end fixed payments, interest rounded each month.
 * Excludes fees, insurance, indexation and contract-specific early-payment rules.
 */
export function amortize(principal: number, payment: number, monthlyPercent: number) {
  if (![principal,payment].every(n=>Number.isSafeInteger(n)&&n>0) || !Number.isFinite(monthlyPercent) || monthlyPercent<0 || monthlyPercent>100) throw Error('Confira saldo, parcela e taxa mensal (0 a 100%).');
  const scale=100000000n;
  const rate=BigInt(Math.round(monthlyPercent*1000000));
  let balance=BigInt(principal), interestTotal=0n;
  for(let month=1;month<=1200;month++) {
    const interest=(balance*rate+scale/2n)/scale;
    if(BigInt(payment)<=interest) throw Error('A parcela não cobre os juros mensais; não há quitação neste cenário.');
    const due=balance+interest;
    balance=due>BigInt(payment)?due-BigInt(payment):0n;
    interestTotal+=interest;
    if(interestTotal>BigInt(Number.MAX_SAFE_INTEGER)) throw Error('Resultado fora do limite de cálculo.');
    if(balance===0n) return {months:month,interestInCents:Number(interestTotal)};
  }
  throw Error('O prazo excede o limite de simulação de 1.200 meses.');
}
export function comparePayments(principal:number,payment:number,rate:number|undefined,extra:number) {
  if(rate===undefined) throw Error('Informe a taxa mensal para simular. Não presumimos juros.');
  if(!Number.isSafeInteger(extra)||extra<0||!Number.isSafeInteger(payment+extra)) throw Error('Aporte inválido.');
  const normal=amortize(principal,payment,rate);
  const accelerated=amortize(principal,payment+extra,rate);
  return {monthsSaved:normal.months-accelerated.months,interestSavedInCents:normal.interestInCents-accelerated.interestInCents,normalMonths:normal.months,acceleratedMonths:accelerated.months};
}
