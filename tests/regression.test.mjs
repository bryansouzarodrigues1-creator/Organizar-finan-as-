import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'finance-regression-'));
after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
// Execute the production TypeScript helpers without adding a test framework.
for(const name of ['money','bankParser','importTransactions','debtSimulation']) {
 const source=fs.readFileSync(new URL(`../src/utils/${name}.ts`,import.meta.url),'utf8');
 const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
 fs.writeFileSync(path.join(tmp,`${name}.js`),output);
}
const require=createRequire(import.meta.url);
const {parseOFX,parsePastedStatement}=require(path.join(tmp,'bankParser.js'));
const {mergeImported}=require(path.join(tmp,'importTransactions.js'));
const {amortize,comparePayments}=require(path.join(tmp,'debtSimulation.js'));
const trn=(id,amount='-50.00',date='20260906')=>`<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>${date}<TRNAMT>${amount}<FITID>${id}<MEMO>Mercado</STMTTRN>`;
const ofx=(entries,account='123')=>`<OFX><BANKID>001<ACCTID>${account}<ACCTTYPE>CHECKING${entries}</OFX>`;
const now='2026-09-06T12:00:00Z';
test('OFX repeat and overlapping periods import each bank ID once',()=>{
 const initial=mergeImported([],parseOFX(ofx(trn('a')+trn('b'))),now);
 const next=mergeImported(initial,parseOFX(ofx(trn('b')+trn('c'))),now);
 assert.equal(next.length,3);
 assert.equal(mergeImported(next,parseOFX(ofx(trn('a')+trn('b')+trn('c'))),now).length,3);
});
test('same FITID in different bank accounts stays distinct',()=>{
 const a=mergeImported([],parseOFX(ofx(trn('a'),'123')),now);
 assert.equal(mergeImported(a,parseOFX(ofx(trn('a'),'456')),now).length,2);
});
test('identical purchases with distinct FITID stay distinct',()=>assert.equal(mergeImported([],parseOFX(ofx(trn('a')+trn('b'))),now).length,2));
test('duplicate FITID within one file is ignored',()=>assert.equal(mergeImported([],parseOFX(ofx(trn('a')+trn('a'))),now).length,1));
test('editing imported description preserves reimport identity',()=>{
 const imported=parseOFX(ofx(trn('a')));
 const saved=mergeImported([],imported,now).map(t=>({...t,description:'Editado'}));
 assert.equal(mergeImported(saved,imported,now).length,1);
});
test('OFX validates account, amount and date and respects amount sign',()=>{
 assert.equal(parseOFX(ofx(trn('a','0.29')))[0].amountInCents,29);
 assert.equal(parseOFX(ofx(trn('a','50.00')))[0].type,'income');
 assert.throws(()=>parseOFX(ofx(trn('a','50bad'))));
 assert.throws(()=>parseOFX(ofx(trn('a','-50','20260230'))));
 assert.throws(()=>parseOFX('<OFX>'+trn('a')+'</OFX>'));
});
test('pasted text repeats do not duplicate; identical lines preserve multiplicity',()=>{
 const text='06/09/2026 Mercado -50,00\n06/09/2026 Mercado -50,00';
 const imported=parsePastedStatement(text,'2026');
 const saved=mergeImported([],imported,now);
 assert.equal(saved.length,2);assert.equal(mergeImported(saved,imported,now).length,2);
 assert.equal(parsePastedStatement('06/09/2026 Pix recebido +R$ 1.234,56','2026')[0].amountInCents,123456);
});
test('pasted text rejects missing/invalid dates and multiple values',()=>{
 for(const text of ['Mercado 50,00','30/02/2026 Mercado 50,00','06/09 Mercado 50,00 saldo 100,00'])assert.throws(()=>parsePastedStatement(text,'2026'));
});
test('zero interest stays zero; no guessed rate',()=>{
 assert.deepEqual(comparePayments(100000,10000,0,10000),{monthsSaved:5,interestSavedInCents:0,normalMonths:10,acceleratedMonths:5});
 assert.throws(()=>comparePayments(100000,10000,undefined,1000),/Informe a taxa/);
});
test('monthly amortization equals independently calculated schedule',()=>{
 // 100.00 principal at 10%; pay 60: interest 10, then 5; final payment 55.
 assert.deepEqual(amortize(10000,6000,10),{months:2,interestInCents:1500});
 assert.deepEqual(comparePayments(10000,6000,10,4000),{monthsSaved:0,interestSavedInCents:400,normalMonths:2,acceleratedMonths:2});
});
test('payment not covering interest and invalid inputs are refused',()=>{
 assert.throws(()=>amortize(100000,1000,1),/não cobre/);
 for(const rate of [-1,NaN,Infinity,101])assert.throws(()=>amortize(10000,1000,rate));
 assert.throws(()=>comparePayments(10000,1000,1,-1));
});
test('legacy imported records without bank identity are not repeated on content match',()=>{
 const imported=parseOFX(ofx(trn('a')));
 const old={...imported[0],importKey:undefined,id:'tx-bank-123',createdAt:now};
 assert.equal(mergeImported([old],imported,now).length,1);
});
test('OFX without FITID has stable fallback identities',()=>{
 const file=ofx(trn('a').replace('<FITID>a',''));
 const imported=parseOFX(file);
 const saved=mergeImported([],imported,now);
 assert.equal(mergeImported(saved,parseOFX(file),now).length,1);
});
