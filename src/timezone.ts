import {Temporal} from '@js-temporal/polyfill';
export function validZone(zone:unknown):zone is string{if(typeof zone!=='string')return false;try{new Intl.DateTimeFormat('en',{timeZone:zone});return true;}catch{return false;}}
export function effectiveZone(value:string){return value==='system'||!validZone(value)?Intl.DateTimeFormat().resolvedOptions().timeZone:value;}
export function offsetRange(date:string,zone:string){const start=Temporal.PlainDate.from(date).toZonedDateTime({timeZone:zone,plainTime:'00:00'});const end=start.add({days:1}).subtract({nanoseconds:1});const first=`UTC${start.offset}`,last=`UTC${end.offset}`;return first===last?first:`${first} → ${last}`;}
export function availableZones(){const intl=Intl as typeof Intl&{supportedValuesOf?:(key:string)=>string[]};return [...new Set(['UTC',Intl.DateTimeFormat().resolvedOptions().timeZone,...(intl.supportedValuesOf?.('timeZone')||[]),...locations.map(l=>l.zone)])].filter(validZone).sort();}
export const locations=[
 {zone:'UTC',ja:'協定世界時',en:'UTC',zh:'协调世界时'},
 {zone:'Asia/Tokyo',ja:'東京',en:'Tokyo',zh:'东京'},
 {zone:'Asia/Shanghai',ja:'上海・北京',en:'Shanghai / Beijing',zh:'上海／北京'},
 {zone:'Asia/Singapore',ja:'シンガポール',en:'Singapore',zh:'新加坡'},
 {zone:'Asia/Bangkok',ja:'バンコク',en:'Bangkok',zh:'曼谷'},
 {zone:'Asia/Kolkata',ja:'インド',en:'India',zh:'印度'},
 {zone:'Asia/Dubai',ja:'ドバイ',en:'Dubai',zh:'迪拜'},
 {zone:'Europe/London',ja:'ロンドン',en:'London',zh:'伦敦'},
 {zone:'Europe/Paris',ja:'パリ',en:'Paris',zh:'巴黎'},
 {zone:'America/New_York',ja:'ニューヨーク',en:'New York',zh:'纽约'},
 {zone:'America/Chicago',ja:'シカゴ',en:'Chicago',zh:'芝加哥'},
 {zone:'America/Los_Angeles',ja:'ロサンゼルス',en:'Los Angeles',zh:'洛杉矶'},
 {zone:'Pacific/Honolulu',ja:'ホノルル',en:'Honolulu',zh:'檀香山'},
 {zone:'Australia/Sydney',ja:'シドニー',en:'Sydney',zh:'悉尼'},
 {zone:'Pacific/Auckland',ja:'オークランド',en:'Auckland',zh:'奥克兰'}
];
