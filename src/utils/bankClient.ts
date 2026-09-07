import {createClient} from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_ANON_KEY;
export const bankConfigured=Boolean(import.meta.env.VITE_BANK_ENABLED==='true'&&url&&key);
export const bankAuth=bankConfigured?createClient(url,key,{auth:{persistSession:false,detectSessionInUrl:false,autoRefreshToken:true}}):null;
export async function bankCall<T>(token:string,body:Record<string,unknown>):Promise<T> {
 if(!bankConfigured)throw Error('Integração ainda não configurada.');
 if(!navigator.onLine)throw Error('Conecte-se à internet para consultar o banco.');
 const res=await fetch(url+'/functions/v1/open-finance',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,apikey:key},body:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(90000)});
 const result=await res.json();if(!res.ok)throw Error(result.error||'Falha ao consultar o banco.');return result as T;
}
