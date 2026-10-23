export interface Config {clientId:string;tenantId:string;redirectUri?:string;tenantMode?:'organizations'|'single'}
export function getRedirectUri(c:Config,origin=location.origin){return c.redirectUri||new URL('/',origin).href;}
export function validateRedirectUri(value:string){const u=new URL(value.trim());if(u.protocol!=='https:'||u.username||u.password||u.hash||u.search)throw Error('Invalid redirect URI');return u.href;}
export const authConfigKey='monja-calendar:authentication';
export function validateConfig(c:Config):Config{
 const clientId=c.clientId.trim(),tenantId=(c.tenantId||'').trim();
 const guid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 if(!guid.test(clientId)||(!guid.test(tenantId)&&(!!tenantId||c.tenantMode==='single'))||[clientId,tenantId].some(id=>/^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(id))||(c.tenantMode!==undefined&&!['organizations','single'].includes(c.tenantMode)))throw Error('Invalid Entra IDs');
 return {clientId:clientId.toLowerCase(),tenantId:tenantId.toLowerCase(),...(c.tenantMode?{tenantMode:c.tenantMode}:{}),...(c.redirectUri?.trim()?{redirectUri:validateRedirectUri(c.redirectUri)}:{})};
}
export function readAuthOverride():Config|null{try{const c=JSON.parse(localStorage.getItem(authConfigKey)||'null');return c?validateConfig(c):null;}catch{return null;}}
export function saveAuthOverride(c:Config){localStorage.setItem(authConfigKey,JSON.stringify(validateConfig(c)));}
export function resetAuthOverride(){localStorage.removeItem(authConfigKey);}
export async function loadConfig():Promise<Config>{
 const custom=readAuthOverride();if(custom)return custom;
 const r=await fetch('/config.json',{cache:'no-store'}); if(!r.ok)throw Error('Configuration unavailable');
 const c=await r.json(); return validateConfig({clientId:import.meta.env.VITE_CLIENT_ID||c.clientId,tenantId:import.meta.env.VITE_TENANT_ID||c.tenantId,redirectUri:import.meta.env.VITE_REDIRECT_URI||c.redirectUri,tenantMode:c.tenantMode});
}
export async function applyAuthSettings(draft:Config,reset:boolean,onApply:(config:Config)=>Promise<void>){
 let next:Config;if(reset){resetAuthOverride();next=await loadConfig();}else{next=validateConfig(draft);saveAuthOverride(next);}await onApply(next);return next;
}
