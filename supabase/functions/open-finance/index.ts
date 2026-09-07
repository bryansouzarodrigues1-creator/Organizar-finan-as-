import { createClient } from 'npm:@supabase/supabase-js@2.115.0';
import {assertItemOwner,collectAccount,validateMonth,hasActiveConsent,type BankAccount} from '../_shared/bank-domain.ts';
const env=(key:string)=>Deno.env.get(key)||'';
const uuid=(s:unknown):s is string=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
Deno.serve(async(req:Request)=>{
 const allowed=env('APP_ORIGIN');const origin=req.headers.get('origin');
 const headers={'Access-Control-Allow-Origin':allowed,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store','Vary':'Origin'};
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...headers,'Content-Type':'application/json'}});
 if(!allowed||origin!==allowed)return reply({error:'Origem não autorizada.'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({error:'Método não permitido.'},405);
 if(!['sandbox','production'].includes(env('BANK_MODE')))return reply({error:'Conexão bancária ainda não configurada.'},503);
 try {
  const admin=createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
  const token=req.headers.get('authorization')?.replace(/^Bearer /,'');
  if(!token)return reply({error:'Entre na sua conta.'},401);
  const {data:{user},error:authError}=await admin.auth.getUser(token);
  if(authError||!user)return reply({error:'Sessão inválida. Entre novamente.'},401);
  const {data:permitted,error:limitError}=await admin.rpc('take_bank_request',{p_user:user.id});
  if(limitError)throw Error('Controle de uso indisponível.');
  if(!permitted)return reply({error:'Aguarde um minuto antes de consultar novamente.'},429);
  const text=await req.text();if(text.length>4000)return reply({error:'Requisição excede o limite.'},413);
  const body=JSON.parse(text);const sandbox=env('BANK_MODE')==='sandbox';
  const ids=env('PLUGGY_CONNECTOR_IDS').split(',').map(Number).filter(n=>Number.isInteger(n)&&n>0);
  if(!ids.length||!env('PLUGGY_CLIENT_ID')||!env('PLUGGY_CLIENT_SECRET'))return reply({error:'Provedor ainda não configurado.'},503);
  const {data:connections,error:listError}=await admin.from('bank_connections').select('item_id,institution,sandbox').eq('user_id',user.id);
  if(listError)throw Error('Banco indisponível.');
  if(body.action==='list')return reply({connections,sandbox});
  let apiKey:string|undefined;
  async function provider(path:string,init:RequestInit={}) {
   if(!apiKey){const res=await fetch('https://api.pluggy.ai/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clientId:env('PLUGGY_CLIENT_ID'),clientSecret:env('PLUGGY_CLIENT_SECRET')}),signal:AbortSignal.timeout(15000)});if(!res.ok)throw Error('Provedor indisponível.');apiKey=(await res.json()).apiKey;}
   const res=await fetch('https://api.pluggy.ai'+path,{...init,headers:{'Content-Type':'application/json','X-API-KEY':apiKey!},signal:AbortSignal.timeout(20000)});
   if(!res.ok)throw Error('Não foi possível consultar o provedor. Confira a autorização no banco.');
   return res.status===204?null:res.json();
  }
  if(body.action==='connect-token') {
   if(body.accepted!==true)return reply({error:'Confirme que deseja iniciar o compartilhamento para consulta.'},400);
   if((connections?.length||0)>=3)return reply({error:'Limite do piloto: três conexões por conta.'},400);
   // Reject direct/scraping connectors. Approval occurs in the bank's own flow.
   for(const id of ids){const connector=await provider('/connectors/'+id);if(!connector.isOpenFinance||Boolean(connector.isSandbox)!==sandbox)throw Error('Conector incompatível com o ambiente.');}
   const result=await provider('/connect_token',{method:'POST',body:JSON.stringify({options:{clientUserId:user.id,avoidDuplicates:true,oauthRedirectUri:allowed+'/'}})});
   return reply({accessToken:result.accessToken,connectorIds:ids,sandbox});
  }
  if(!uuid(body.itemId))return reply({error:'Conexão inválida.'},400);
  const owned=connections?.find(c=>c.item_id===body.itemId);
  if(body.action!=='attach'&&!owned)return reply({error:'Conexão não encontrada.'},404);
  const item=await provider('/items/'+body.itemId);
  assertItemOwner(item,user.id,ids,sandbox);
  if(body.action==='attach') {
   if(body.accepted!==true)return reply({error:'Consentimento de consulta ausente.'},400);
   if(!owned&&(connections?.length||0)>=3)return reply({error:'Limite de conexões atingido.'},400);
   const {error}=await admin.from('bank_connections').upsert({item_id:body.itemId,user_id:user.id,institution:item.connector.name||'Instituição',sandbox,notice_version:'bank-read-v1'},{onConflict:'item_id'});
   if(error)throw Error('Não foi possível registrar a conexão.');return reply({attached:true,status:item.status});
  }
  if(body.action==='disconnect') {
   await provider('/items/'+body.itemId,{method:'DELETE'});
   const {error}=await admin.from('bank_connections').delete().eq('item_id',body.itemId).eq('user_id',user.id);
   if(error)throw Error('Não foi possível remover os registros locais da conexão.');return reply({disconnected:true});
  }
  if(body.action!=='snapshot')return reply({error:'Operação não disponível.'},400);
  const consentResponse=await provider('/consents?itemId='+encodeURIComponent(body.itemId));
  if(!hasActiveConsent(consentResponse.results,Date.now())) {
   await admin.from('bank_snapshots').delete().eq('item_id',body.itemId).eq('user_id',user.id);
   return reply({error:'Autorização expirada, revogada ou sem acesso a transações. Nenhum extrato será exibido.'},403);
  }
  const month=validateMonth(body.month);
  if(item.status!=='UPDATED')return reply({error:'O banco ainda não concluiu a atualização ou precisa renovar a autorização.'},409);
  const {data:cached,error:cacheError}=await admin.from('bank_snapshots').select('payload,synced_at').eq('item_id',body.itemId).eq('user_id',user.id).eq('month',month).maybeSingle();
  if(cacheError)throw Error('Falha ao consultar extrato salvo.');
  if(cached&&Date.now()-Date.parse(cached.synced_at)<15*60*1000)return reply(cached.payload);
  const list=await provider('/accounts?itemId='+encodeURIComponent(body.itemId));
  if(!Array.isArray(list.results)||list.results.length>10)throw Error('Contas excedem o escopo do piloto.');
  const accounts:BankAccount[]=list.results.filter((a:any)=>['BANK','CREDIT'].includes(a.type)&&a.currencyCode==='BRL').map((a:any)=>({id:a.id,name:a.name,type:a.type,currencyCode:a.currencyCode}));
  const movements=[];for(const account of accounts)movements.push(...await collectAccount(provider,account,month));
  const payload={accounts,movements,month,sandbox,syncedAt:new Date().toISOString(),bankUpdatedAt:item.lastUpdatedAt||null};
  const {error}=await admin.from('bank_snapshots').upsert({item_id:body.itemId,user_id:user.id,month,payload,synced_at:payload.syncedAt},{onConflict:'item_id,month'});
  if(error)throw Error('Não foi possível salvar o extrato.');return reply(payload);
 } catch {return reply({error:'Não foi possível concluir. Verifique a configuração, a autorização bancária ou tente novamente mais tarde.'},400);}
});
