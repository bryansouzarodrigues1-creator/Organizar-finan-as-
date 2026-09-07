import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function compile(file){return ts.transpileModule(fs.readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;}
const domain={exports:{}};vm.runInNewContext(compile('../supabase/functions/_shared/bank-domain.ts'),{exports:domain.exports,URLSearchParams,Map,Set,Date,BigInt});
const {assertItemOwner,normalizeMovement,nextCursor,collectAccount}=domain.exports;
const account={id:'account-a',name:'Conta',type:'BANK',currencyCode:'BRL'};
test('bank account ownership and connector environment are enforced',()=>{
 const item={clientUserId:'user-a',connector:{id:1,isOpenFinance:true,isSandbox:true}};
 assert.doesNotThrow(()=>assertItemOwner(item,'user-a',[1],true));
 assert.throws(()=>assertItemOwner(item,'user-b',[1],true));
 assert.throws(()=>assertItemOwner(item,'user-a',[2],true));
 assert.throws(()=>assertItemOwner(item,'user-a',[1],false));
 assert.throws(()=>assertItemOwner({...item,connector:{...item.connector,isOpenFinance:false}},'user-a',[1],true));
});
test('bank and card signs are different; merchant is never invented',()=>{
 const raw={id:'tx',date:'2026-09-06T10:00:00Z',description:'Loja',amount:25.29,status:'POSTED'};
 assert.equal(normalizeMovement(raw,account).direction,'credit');
 const card=normalizeMovement(raw,{...account,type:'CREDIT'});
 assert.equal(card.direction,'debit');assert.equal(card.amountInCents,2529);assert.equal(card.merchant,null);
});
test('cursor pagination keeps account/month bound and never follows a foreign URL',async()=>{
 const requests=[];let calls=0;
 const rows=await collectAccount(async path=>{requests.push(path);return ++calls===1?{results:[{id:'a',date:'2026-09-01',amount:-1}],next:'?accountId=foreign&after=next123'}:{results:[{id:'a',date:'2026-09-01',amount:-1},{id:'b',date:'2026-09-02',amount:-2}],next:null};},account,'2026-09');
 assert.equal(rows.length,2);assert.match(requests[1],/accountId=account-a/);assert.match(requests[1],/after=next123/);assert.match(requests[1],/dateFrom=2026-09-01/);
 assert.throws(()=>nextCursor('https://evil.example/steal'));
});
test('incomplete or cyclic bank responses fail without a partial snapshot',async()=>{
 await assert.rejects(()=>collectAccount(async()=>({results:[],next:'?after=repeat'}),account,'2026-09'),/repetida/);
 await assert.rejects(()=>collectAccount(async()=>({results:[{id:'a',date:'2026-08-01',amount:1}],next:null}),account,'2026-09'),/Período/);
});
function handler({user={id:'u'},connections=[],item,allowed='https://app.example',mode='sandbox'}={}) {
 let serve;const paths=[];
 const builder={select(){return this;},eq(){return this;},then(resolve){return Promise.resolve(resolve({data:connections,error:null}));}};
 const admin={auth:{getUser:async()=>({data:{user},error:null})},rpc:async()=>({data:true,error:null}),from:()=>builder};
 const env={APP_ORIGIN:allowed,BANK_MODE:mode,SUPABASE_URL:'https://database.example',SUPABASE_SERVICE_ROLE_KEY:'test-only',PLUGGY_CLIENT_ID:'test-only',PLUGGY_CLIENT_SECRET:'test-only',PLUGGY_CONNECTOR_IDS:'1'};
 vm.runInNewContext(compile('../supabase/functions/open-finance/index.ts'),{exports:{},require:name=>name.startsWith('npm:')?{createClient:()=>admin}:domain.exports,Deno:{env:{get:key=>env[key]},serve:fn=>serve=fn},Response,Request,URL,URLSearchParams,AbortSignal,fetch:async url=>{paths.push(url);return Response.json(url.endsWith('/auth')?{apiKey:'test-only'}:item);},Date});
 return {run:serve,paths};
}
const request=(body,origin='https://app.example')=>new Request('https://database.example/functions/v1/open-finance',{method:'POST',headers:{origin,Authorization:'Bearer fake','Content-Type':'application/json'},body:JSON.stringify(body)});
test('HTTP endpoint denies unauthenticated users before touching provider',async()=>{
 const h=handler({user:null});const res=await h.run(request({action:'list'}));assert.equal(res.status,401);assert.equal(h.paths.length,0);
});
test('disabled deployment and foreign origins cannot reach provider',async()=>{
 for(const options of [{mode:'disabled'},{}]){const h=handler(options);const res=await h.run(request({action:'connect-token'},options.mode?'https://app.example':'https://evil.example'));assert.ok([403,503].includes(res.status));assert.equal(h.paths.length,0);}
});
test('item not in authenticated users connections cannot be read or deleted',async()=>{
 for(const action of ['snapshot','disconnect']){const h=handler();const res=await h.run(request({action,itemId:'11111111-1111-1111-1111-111111111111',month:'2026-09'}));assert.equal(res.status,404);assert.equal(h.paths.length,0);}
});
test('forged callback cannot attach an item owned by another user',async()=>{
 const h=handler({item:{clientUserId:'someone-else',connector:{id:1,isOpenFinance:true,isSandbox:true}}});
 const res=await h.run(request({action:'attach',accepted:true,itemId:'11111111-1111-1111-1111-111111111111'}));assert.equal(res.status,400);
});

test('expired, revoked or missing transaction consent cannot serve a cached snapshot',()=>{
 const {hasActiveConsent}=domain.exports;const now=Date.parse('2026-09-06T00:00:00Z');
 const consent={products:['TRANSACTIONS'],expiresAt:null,revokedAt:null};
 assert.equal(hasActiveConsent([consent],now),true);
 assert.equal(hasActiveConsent([{...consent,revokedAt:'2026-09-01'}],now),false);
 assert.equal(hasActiveConsent([{...consent,expiresAt:'2026-09-05'}],now),false);
 assert.equal(hasActiveConsent([{...consent,products:['IDENTITY']}],now),false);
 assert.equal(hasActiveConsent(undefined,now),false);
});
