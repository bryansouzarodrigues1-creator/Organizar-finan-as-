import test from 'node:test';
import assert from 'node:assert/strict';
import {money,emptyState,saveEntry,saveDebt,settle,removeEntry,removeDebt,summary,validDate,validate} from '../src/finance.js';
import {load,persist} from '../src/storage.js';
const today='2026-09-06';
const entry=(overrides={})=>({id:'e1',description:'Conta',amount:10000,kind:'expense',due:today,paidOn:null,debtId:null,...overrides});
test('money parses cents exactly and rejects ambiguous/invalid values',()=>{
 assert.equal(money('0,29'),29);assert.equal(money('1200.5'),120050);assert.equal(money('-10,50',true),-1050);
 for(const input of ['1.234,56','1e3','0.001','NaN','-1','', '99999999999999999'])assert.throws(()=>money(input));
});
test('calendar dates reject impossible dates and accept leap days',()=>{assert.equal(validDate('2026-02-30'),false);assert.equal(validDate('2024-02-29'),true);});
test('pending income does not inflate current balance; overdue bills remain projected',()=>{
 let s={...emptyState(),opening:50000};
 s=saveEntry(s,entry({due:'2026-08-20'}));
 s=saveEntry(s,entry({id:'salary',kind:'income',amount:200000,due:'2026-09-30'}));
 s=saveEntry(s,entry({id:'october',amount:5000,due:'2026-10-01'}));
 assert.deepEqual(summary(s,today),{current:50000,projected:240000,pendingIncome:200000,pendingExpense:10000,remainingDebt:0,overdue:[s.entries[0]],unallocated:0});
});
test('partial debt payment changes cash once and preserves unpaid principal',()=>{
 let s=saveDebt({...emptyState(),opening:50000},{id:'debt',description:'Acordo',amount:60000});
 s=saveEntry(s,entry({debtId:'debt',amount:20000}));
 const before=summary(s,today);assert.equal(before.projected,30000);assert.equal(before.unallocated,40000);
 s=settle(s,'e1',today);s=settle(s,'e1',today);
 const after=summary(s,today);assert.equal(after.current,30000);assert.equal(after.projected,30000);assert.equal(after.remainingDebt,40000);
 s=removeEntry(s,'e1');assert.equal(summary(s,today).current,50000);assert.equal(summary(s,today).remainingDebt,60000);
});
test('editing replaces the entry and reopening payment restores cash',()=>{
 let s=saveEntry({...emptyState(),opening:100000},entry({paidOn:today}));
 s=saveEntry(s,entry({amount:15000,paidOn:today}));assert.equal(s.entries.length,1);assert.equal(summary(s,today).current,85000);
 s=saveEntry(s,entry({amount:15000}));assert.equal(summary(s,today).current,100000);assert.equal(summary(s,today).projected,85000);
});
test('overallocated debt, linked income and orphan references are rejected',()=>{
 let s=saveDebt(emptyState(),{id:'d',description:'Dívida',amount:10000});
 assert.throws(()=>saveEntry(s,entry({debtId:'d',amount:10001})));
 assert.throws(()=>saveEntry(s,entry({debtId:'d',kind:'income'})));
 assert.throws(()=>saveEntry(s,entry({debtId:'missing'})));
 s=saveEntry(s,entry({debtId:'d'}));assert.throws(()=>removeDebt(s,'d'));
 assert.throws(()=>saveDebt(s,{id:'d',description:'Dívida',amount:5000}));
});
test('invalid amounts, duplicate identifiers and invalid payment dates are rejected',()=>{
 for(const amount of [0,-1,0.5,Infinity])assert.throws(()=>saveEntry(emptyState(),entry({amount})));
 assert.throws(()=>validate({...emptyState(),entries:[entry(),entry()]}));
 assert.throws(()=>saveEntry(emptyState(),entry({paidOn:'2026-02-30'})));
});
test('storage restores saved records and preserves corrupt data on failure',()=>{
 const map=new Map();const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 assert.deepEqual(load(storage),emptyState());const s=saveEntry(emptyState(),entry());persist(storage,s);assert.deepEqual(load(storage),s);
 const key=[...map.keys()][0];map.set(key,'broken');assert.throws(()=>load(storage));assert.equal(map.get(key),'broken');
});
test('storage quota error is visible to caller',()=>{assert.throws(()=>persist({setItem(){throw Error('Quota');}},emptyState()),/Quota/);});
