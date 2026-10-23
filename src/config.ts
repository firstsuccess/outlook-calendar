export interface Config {clientId:string;tenantId:string}
export const authConfigKey='monja-calendar:authentication';
export function validateConfig(c:Config):Config{
 const clientId=c.clientId.trim(),tenantId=c.tenantId.trim();
 const guid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 if(!guid.test(clientId)||!guid.test(tenantId)||[clientId,tenantId].some(id=>/^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(id)))throw Error('Invalid Entra IDs');
 return {clientId:clientId.toLowerCase(),tenantId:tenantId.toLowerCase()};
}
export function readAuthOverride():Config|null{try{const c=JSON.parse(localStorage.getItem(authConfigKey)||'null');return c?validateConfig(c):null;}catch{return null;}}
export function saveAuthOverride(c:Config){localStorage.setItem(authConfigKey,JSON.stringify(validateConfig(c)));}
export function resetAuthOverride(){localStorage.removeItem(authConfigKey);}
export async function loadConfig():Promise<Config>{
 const custom=readAuthOverride();if(custom)return custom;
 const r=await fetch('/config.json',{cache:'no-store'}); if(!r.ok)throw Error('Configuration unavailable');
 const c=await r.json(); return validateConfig({clientId:import.meta.env.VITE_CLIENT_ID||c.clientId,tenantId:import.meta.env.VITE_TENANT_ID||c.tenantId});
}
