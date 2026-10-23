export interface Config {clientId:string;tenantId:string}
export async function loadConfig():Promise<Config>{
 const r=await fetch('/config.json',{cache:'no-store'}); if(!r.ok)throw Error('Configuration unavailable');
 const c=await r.json(); return {...c,clientId:import.meta.env.VITE_CLIENT_ID||c.clientId,tenantId:import.meta.env.VITE_TENANT_ID||c.tenantId};
}
