import {it,expect} from 'vitest';
import {counter,type Environment} from '../worker/index';
const origin='https://calendar.example';
function database(){
 let count:number|undefined;const statements:string[]=[];
 const env={DB:{prepare(sql:string){
  statements.push(sql);
  return {bind:()=>({first:async()=>{
   if(sql.startsWith('INSERT'))count=count===undefined?100:count+1;
   return count===undefined?null:{value:count};
  }})};
 }}} as unknown as Environment;
 return {env,statements};
}
const request=(method='POST',from=origin)=>new Request(origin+'/api/visit-counter',{method,headers:{Origin:from}});
it('starts at 100, increments persistently and GET does not increment',async()=>{const {env,statements}=database();expect(await (await counter(request(),env)).json()).toEqual({count:100});expect(await (await counter(request(),env)).json()).toEqual({count:101});expect(await (await counter(request('GET'),env)).json()).toEqual({count:101});expect(statements[0]).toContain('ON CONFLICT(id) DO UPDATE SET value = value + 1 RETURNING value');});
it('rejects foreign-origin increments and unsupported methods',async()=>{const {env,statements}=database();expect((await counter(request('POST','https://foreign.example'),env)).status).toBe(403);expect((await counter(request('DELETE'),env)).status).toBe(405);expect(statements).toHaveLength(0);});
it('does not cache results or fake a successful count on DB failure',async()=>{const {env}=database();expect((await counter(request(),env)).headers.get('Cache-Control')).toBe('no-store');const broken={DB:{prepare(){throw Error('failure');}}} as Environment;expect((await counter(request(),broken)).status).toBe(503);});
