import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
// This test checks the generated production worker: run npm run build before npm test.
const source=fs.readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
function worker(){const events={};vm.runInNewContext(source,{self:{location:{origin:'https://app.example'},addEventListener:(name,fn)=>events[name]=fn},URL,caches:{match:async()=>new Response('offline shell')},fetch:async()=>{throw Error('offline');}});return events;}
test('PWA leaves bank/API/auth requests to network and never caches them',()=>{
 const {fetch}=worker();
 for(const url of ['https://bank.example/transactions','https://app.example/functions/v1/open-finance','https://app.example/?code=oauth','https://app.example/api/bank']){
  let intercepted=false;fetch({request:{url,method:'GET',mode:'cors'},respondWith(){intercepted=true;}});assert.equal(intercepted,false,url);
 }
 let intercepted=false;fetch({request:{url:'https://app.example/',method:'POST',mode:'cors'},respondWith(){intercepted=true;}});assert.equal(intercepted,false);
});
test('PWA serves cached static shell when navigation is offline',async()=>{
 let response;worker().fetch({request:{url:'https://app.example/',method:'GET',mode:'navigate'},respondWith:p=>response=p});
 assert.equal(await (await response).text(),'offline shell');
});
test('manifest has installable sizes, standalone mode and actual PNG assets',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../dist/manifest.webmanifest',import.meta.url)));
 assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'/');
 for(const size of [192,512]){const icon=manifest.icons.find(i=>i.sizes===`${size}x${size}`);assert.ok(icon);const png=fs.readFileSync(new URL('../dist'+icon.src,import.meta.url));assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);}
});
