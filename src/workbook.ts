import {validateUrl} from './excel';
import type {Preferences} from './preferences';
export interface WorkbookReference{excelUrl:string;driveId:string;itemId:string}
export function workbookReference(p:Preferences):WorkbookReference{return {excelUrl:p.personalUrl,driveId:p.personalDriveId,itemId:p.personalItemId};}
export function validateReference(ref:WorkbookReference):WorkbookReference{
 const excelUrl=ref.excelUrl.trim(),driveId=ref.driveId.trim(),itemId=ref.itemId.trim();
 if(!excelUrl){if(driveId||itemId)throw Error('URL_REQUIRED');return {excelUrl:'',driveId:'',itemId:''};}
 const url=validateUrl(excelUrl);
 if(!!driveId!==!!itemId)throw Error('IDS_REQUIRED');
 if(!driveId){const path=url.searchParams.get('id')||url.pathname;if(!path.toLowerCase().endsWith('.xlsx')||path.includes('/:x:/'))throw Error('DIRECT_URL_REQUIRED');}
 return {excelUrl:url.href,driveId,itemId};
}
export function applyReference(p:Preferences,ref:WorkbookReference):Preferences{return {...p,personalUrl:ref.excelUrl,personalDriveId:ref.driveId,personalItemId:ref.itemId,org:'',selections:{}};}
export function preferencesKey(tenantId:string,accountId:string){return `monja-calendar:${tenantId}:${accountId}`;}
