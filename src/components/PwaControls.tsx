import { useEffect, useState } from 'react';
interface InstallEvent extends Event { prompt:()=>Promise<void>; userChoice:Promise<{outcome:'accepted'|'dismissed'}> }
export function PwaControls() {
 const [install,setInstall]=useState<InstallEvent|null>(null);
 const [waiting,setWaiting]=useState<ServiceWorker|null>(null);
 const [offline,setOffline]=useState(!navigator.onLine);
 const [installed,setInstalled]=useState(window.matchMedia('(display-mode: standalone)').matches);
 const [error,setError]=useState('');
 useEffect(()=>{
  const onInstall=(e:Event)=>{e.preventDefault();setInstall(e as InstallEvent);};
  const onInstalled=()=>{setInstalled(true);setInstall(null);};
  const onNetwork=()=>setOffline(!navigator.onLine);
  window.addEventListener('beforeinstallprompt',onInstall);window.addEventListener('appinstalled',onInstalled);
  window.addEventListener('online',onNetwork);window.addEventListener('offline',onNetwork);
  if(import.meta.env.PROD && 'serviceWorker' in navigator){
   navigator.serviceWorker.register('/sw.js').then(reg=>{
    if(reg.waiting)setWaiting(reg.waiting);
    reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)setWaiting(worker);});});
   }).catch(()=>setError('Não foi possível preparar o acesso offline. Tente novamente com conexão.'));
  }
  return()=>{window.removeEventListener('beforeinstallprompt',onInstall);window.removeEventListener('appinstalled',onInstalled);window.removeEventListener('online',onNetwork);window.removeEventListener('offline',onNetwork);};
 },[]);
 return <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-3 text-sm flex flex-wrap items-center gap-3">
  {offline&&<p role="status" className="text-amber-900">Sem internet: somente registros locais. Consulta bancária indisponível.</p>}
  {!installed&&(install?<button className="border rounded-lg px-3 py-2 bg-white" onClick={async()=>{try{await install.prompt();await install.userChoice;}catch{setError('Use o menu do navegador para instalar.');}setInstall(null);}}>Instalar aplicativo</button>:<details><summary className="cursor-pointer">Instalar no celular</summary><p className="py-2">No menu do navegador, procure “Instalar aplicativo” ou “Adicionar à tela inicial”. No Safari, use Compartilhar → Adicionar à Tela de Início. A opção depende do navegador e de uma conexão HTTPS.</p></details>)}
  {waiting&&<button className="border rounded-lg px-3 py-2 bg-white" onClick={()=>{if(!confirm('Salve o formulário aberto antes de atualizar. Atualizar agora?'))return;navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});waiting.postMessage('ACTIVATE_UPDATE');}}>Atualizar aplicativo</button>}
  {error&&<p role="status">{error}</p>}
 </div>;
}
