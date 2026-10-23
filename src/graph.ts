import type {Auth} from './auth';
export class GraphError extends Error{constructor(readonly status:number){super(`Microsoft Graph ${status}`);}}
export const calendarScopes=['Calendars.ReadBasic','Calendars.Read.Shared'];
export const fileScopes=['Files.Read.All'];
export function retryDelay(header:string|null,attempt:number){if(header){const n=Number(header);if(Number.isFinite(n)&&n>=0)return n*1000;const d=Date.parse(header);if(Number.isFinite(d))return Math.max(0,d-Date.now());}return 1000*2**attempt;}
export class Graph{
 constructor(readonly auth:Auth){}
 async json<T>(path:string,scopes:string[],signal:AbortSignal,body?:unknown):Promise<T>{
  const u=new URL(path.startsWith('https:')?path:`https://graph.microsoft.com/v1.0${path}`);
  if(u.origin!=='https://graph.microsoft.com'||!u.pathname.startsWith('/v1.0/'))throw Error('Invalid Graph URL');
  if(body!==undefined&&u.pathname!=='/v1.0/me/calendar/getSchedule')throw Error('Write prohibited');
  for(let attempt=0;attempt<4;attempt++){
   const token=await this.auth.token(scopes,attempt===1);
   const r=await fetch(u,{method:body===undefined?'GET':'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'outlook.timezone="UTC"'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.any([signal,AbortSignal.timeout(45000)]),cache:'no-store',redirect:'error'});
   if(r.ok)return r.json() as Promise<T>;
   if(r.status===401&&attempt===0)continue;
   if((r.status===429||r.status===503)&&attempt<3){await new Promise<void>((resolve,reject)=>{const done=()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'));};const timer=setTimeout(()=>{signal.removeEventListener('abort',done);resolve();},retryDelay(r.headers.get('Retry-After'),attempt));if(signal.aborted)done();else signal.addEventListener('abort',done,{once:true});});continue;}
   throw new GraphError(r.status);
  }throw Error('Retry limit');
 }
 async list<T>(path:string,scopes:string[],signal:AbortSignal){const result:T[]=[];const seen=new Set<string>();let next:string|undefined=path;while(next){if(seen.has(next)||seen.size>200)throw Error('Pagination limit');seen.add(next);const page: {value:T[];'@odata.nextLink'?:string}=await this.json(next,scopes,signal);if(!Array.isArray(page.value))throw Error('Invalid collection');result.push(...page.value);next=page['@odata.nextLink'];}return result;}
}
