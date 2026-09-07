import {readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const files=['/','/index.html','/manifest.webmanifest','/icons/icon-192.png','/icons/icon-512.png','/icons/icon.svg',...(await readdir('dist/assets')).filter(n=>/\.(js|css)$/.test(n)).map(n=>'/assets/'+n)];
const hash=createHash('sha256');for(const file of files)hash.update(await readFile('dist'+(file==='/'?'/index.html':file)));
const version='financas-shell-'+hash.digest('hex').slice(0,16);
await writeFile('dist/sw.js',`
const CACHE=${JSON.stringify(version)};
const FILES=${JSON.stringify(files)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('financas-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 // Never cache APIs, external domains, auth callbacks, bank data, or non-GET calls.
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.search||url.hash)return;
 if(event.request.mode==='navigate'&&(url.pathname==='/'||url.pathname==='/index.html')){
   event.respondWith(fetch(event.request).catch(()=>caches.match('/index.html')));return;
 }
 if(FILES.includes(url.pathname))event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)));
});
`);
console.log('PWA: manifest, icons and versioned static-only service worker built.');
