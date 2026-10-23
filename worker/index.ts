interface Statement{bind(...values:unknown[]):Statement;first<T>():Promise<T|null>}
export interface Environment{DB:{prepare(sql:string):Statement}}
type Asset={body:string;type:string};
const assets:Record<string,Asset>=/*__SITE_ASSETS__*/ {};
function json(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export async function counter(request:Request,env:Environment){
 if(!['GET','POST'].includes(request.method))return new Response(null,{status:405,headers:{Allow:'GET, POST'}});
 if(request.method==='POST'&&(request.headers.get('Origin')!==new URL(request.url).origin||request.headers.get('Sec-Fetch-Site')==='cross-site'))return json({error:'Forbidden'},403);
 try{
  const sql=request.method==='POST'?'INSERT INTO page_counters (id) VALUES (?) ON CONFLICT(id) DO UPDATE SET value = value + 1 RETURNING value':'SELECT value FROM page_counters WHERE id = ?';
  const row=await env.DB.prepare(sql).bind('main').first<{value:number}>();
  return json({count:row?.value??100});
 }catch{return json({error:'Unavailable'},503);}
}
export default {async fetch(request:Request,env:Environment){
 const url=new URL(request.url);if(url.pathname==='/api/visit-counter')return counter(request,env);
 if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
 const path=url.pathname==='/'?'/index.html':url.pathname;const asset=assets[path];if(!asset)return new Response('Not found',{status:404});
 const bytes=Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0));
 return new Response(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':asset.type,...(path==='/OrganizationAddressBook.xlsx'?{'Content-Disposition':'attachment; filename="OrganizationAddressBook.xlsx"'}:{}),'Cache-Control':path==='/config.json'?'no-store':/^\/assets\/.*-[\w-]+\.(js|css)$/.test(path)?'public, max-age=31536000, immutable':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Strict-Transport-Security':'max-age=31536000','Permissions-Policy':'camera=(), microphone=(), geolocation=()'}});
}};
