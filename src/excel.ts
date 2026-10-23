import {readSheet} from 'read-excel-file/browser';
import {parseBook,tableRows,orgColumns,memberColumns,type Book} from './model';
import {Graph,fileScopes} from './graph';
import type {Config} from './config';
export function validateUrl(value:string){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||!/(^|\.)sharepoint\.com$/i.test(u.hostname))throw Error('SharePoint / OneDrive for Business HTTPS URL required');return u;}
interface Item{id:string;name:string;eTag:string;size:number;file?:unknown;webUrl:string;parentReference:{driveId:string};'@microsoft.graph.downloadUrl'?:string}
export interface Master{book:Book;etag:string;checked:number;url:string}
export async function loadMaster(graph:Graph,c:Config,signal:AbortSignal,previous?:Master):Promise<Master>{
 const url=validateUrl(c.excelUrl);let root:string;
 if(c.driveId&&c.itemId)root=`/drives/${encodeURIComponent(c.driveId)}/items/${encodeURIComponent(c.itemId)}`;
 else{
  // Resolve a direct library file URL. Sharing links with opaque tokens need administrator-supplied IDs.
  const pathname=url.searchParams.get('id')||url.pathname;
  const parts=pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if(!parts.at(-1)?.toLowerCase().endsWith('.xlsx')||parts.includes(':x:'))throw Error('Direct .xlsx URL or configured driveId/itemId required');
  const siteLength=['sites','teams','personal'].includes(parts[0])?2:0;
  const site=await graph.json<{id:string}>(`/sites/${url.hostname}:/${parts.slice(0,siteLength).map(encodeURIComponent).join('/')}`,['Sites.Read.All'],signal);
  const drives=await graph.list<{id:string;webUrl:string}>(`/sites/${encodeURIComponent(site.id)}/drives`,['Sites.Read.All'],signal);
  const direct=new URL(url.origin+'/'+parts.map(encodeURIComponent).join('/'));
  const drive=drives.find(d=>{const p=new URL(d.webUrl);return p.origin===direct.origin&&decodeURIComponent(direct.pathname).startsWith(decodeURIComponent(p.pathname).replace(/\/$/,'')+'/');});
  if(!drive)throw Error('Document library not found');
  const relative=decodeURIComponent(direct.pathname).slice(decodeURIComponent(new URL(drive.webUrl).pathname).replace(/\/$/,'').length+1);
  root=`/drives/${encodeURIComponent(drive.id)}/root:/${relative.split('/').map(encodeURIComponent).join('/')}`;
 }
 const item=await graph.json<Item>(root,fileScopes,signal);
 if(!item.file||!item.name.toLowerCase().endsWith('.xlsx')||item.size>10*1024*1024)throw Error('Invalid XLSX (maximum 10 MB)');
 if(previous&&previous.url===c.excelUrl&&previous.etag===item.eTag)return {...previous,checked:Date.now()};
 const fresh=await graph.json<Item>(`/drives/${encodeURIComponent(item.parentReference.driveId)}/items/${encodeURIComponent(item.id)}`,fileScopes,signal);
 const download=new URL(fresh['@microsoft.graph.downloadUrl']||'');
 if(download.protocol!=='https:'||!/(^|\.)(sharepoint\.com|1drv\.com)$/i.test(download.hostname))throw Error('Invalid download origin');
 const r=await fetch(download,{signal,credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});if(!r.ok)throw Error('Excel download failed');
 const bytes=await r.arrayBuffer();if(bytes.byteLength>10*1024*1024)throw Error('Excel too large');
 const read=async(name:string,columns:string[])=>{const rows=await readSheet(new Blob([bytes]),name);if(rows.length>50000)throw Error(`Sheet too large: ${name}`);return tableRows([rows[0]||[]],rows.slice(1),columns);};
 const orgs=await read('Organizations',orgColumns),members=await read('Members',memberColumns);
 return {book:parseBook(orgs,members),etag:fresh.eTag,checked:Date.now(),url:c.excelUrl};
}
