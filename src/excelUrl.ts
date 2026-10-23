export function validateUrl(value:string){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||!/(^|\.)sharepoint\.com$/i.test(u.hostname))throw Error('SharePoint / OneDrive for Business HTTPS URL required');return u;}
export function excelPathParts(url:URL){
 // URLSearchParams already decodes its value. Pathname still contains percent escapes.
 const path=url.searchParams.get('id')||decodeURIComponent(url.pathname);
 const parts=path.split('/').filter(Boolean);
 if(parts.some(p=>p==='.'||p==='..'))throw Error('Invalid file path');
 return parts;
}
export function isDirectExcelUrl(url:URL){const parts=excelPathParts(url);return !!parts.at(-1)?.toLowerCase().endsWith('.xlsx')&&!parts.includes(':x:');}
