import {Temporal} from '@js-temporal/polyfill';
import {Graph,GraphError,calendarScopes} from './graph';
export type Status='free'|'busy'|'tentative'|'oof'|'workingElsewhere'|'unknown';
export interface Event {id:string;start:number;end:number;status:Status;private:boolean;subject?:string;location?:string;body?:string;allDay?:boolean}
export interface Schedule {email:string;state:'ok'|'denied'|'error';events:Event[];details:'available'|'unavailable'|'error'}
interface DateTime {dateTime:string;timeZone:string}
interface ScheduleItem{status:string;start:DateTime;end:DateTime;isPrivate?:boolean;subject?:string;location?:string}
interface ScheduleResponse{scheduleId:string;error?:unknown;scheduleItems?:ScheduleItem[]}
interface Calendar{id:string;owner?:{address?:string};canViewPrivateItems?:boolean}
interface GraphEvent{id:string;start:DateTime;end:DateTime;showAs:string;sensitivity:string;subject?:string;location?:{displayName?:string};bodyPreview?:string;isAllDay?:boolean;isCancelled?:boolean}
export function epoch(d:DateTime){if(d.timeZone!=='UTC'&&d.timeZone!=='Etc/UTC')throw Error('Unexpected Graph timezone');return Number(Temporal.Instant.from(d.dateTime.replace(/Z$/,'')+'Z').epochMilliseconds);}
export function status(s:string):Status{return ['free','busy','tentative','oof','workingElsewhere'].includes(s)?s as Status:'unknown';}
export function sanitize(e:GraphEvent):Event{return {id:e.id,start:epoch(e.start),end:epoch(e.end),status:status(e.showAs),private:e.sensitivity==='private'||e.sensitivity==='confidential',...(!(e.sensitivity==='private'||e.sensitivity==='confidential')?{subject:e.subject,location:e.location?.displayName,body:e.bodyPreview}:{}),allDay:e.isAllDay};}
export function dayBounds(date:string,zone:string){const start=Temporal.PlainDate.from(date).toZonedDateTime({timeZone:zone,plainTime:'00:00'});return {start:Number(start.epochMilliseconds),end:Number(start.add({days:1}).epochMilliseconds)};}
export function dayList(date:string,week:boolean){const d=Temporal.PlainDate.from(date);const start=week?d.subtract({days:d.dayOfWeek-1}):d;return Array.from({length:week?7:1},(_,i)=>start.add({days:i}).toString());}
export function atTime(date:string,hour:number,zone:string){return Number(Temporal.PlainDate.from(date).toZonedDateTime({timeZone:zone,plainTime:Temporal.PlainTime.from({hour:hour===24?0:hour})}).add({days:hour===24?1:0}).epochMilliseconds);}
export async function fetchSchedules(g:Graph,emails:string[],start:number,end:number,signal:AbortSignal):Promise<Schedule[]>{
 const out=new Map<string,Schedule>(emails.map(email=>[email,{email,state:'error',events:[],details:'unavailable'}]));
 for(let offset=0;offset<emails.length;offset+=20){const chunk=emails.slice(offset,offset+20);try{
  const response=await g.json<{value:ScheduleResponse[]}>('/me/calendar/getSchedule',['Calendars.ReadBasic'],signal,{schedules:chunk,startTime:{dateTime:new Date(start).toISOString(),timeZone:'UTC'},endTime:{dateTime:new Date(end).toISOString(),timeZone:'UTC'},availabilityViewInterval:5});
  for(const item of response.value){const key=item.scheduleId.toLowerCase();if(!out.has(key))continue;if(item.error||!Array.isArray(item.scheduleItems)){out.set(key,{email:key,state:'error',events:[],details:'unavailable'});continue;}
   out.set(key,{email:key,state:'ok',details:'unavailable',events:item.scheduleItems.map((e,i)=>({id:`schedule-${i}`,start:epoch(e.start),end:epoch(e.end),status:status(e.status),private:!!e.isPrivate,...(!e.isPrivate?{subject:e.subject,location:e.location}:{})}))});
  }
 }catch(e){if(signal.aborted)throw e;for(const email of chunk)out.set(email,{email,state:e instanceof GraphError&&e.status===403?'denied':'error',events:[],details:'unavailable'});}}
 // Only calendar IDs returned to the signed-in recipient are used, never arbitrary email-to-UPN guesses.
 let calendars:Calendar[];try{calendars=await g.list<Calendar>('/me/calendars?$select=id,owner,canViewPrivateItems',calendarScopes,signal);}catch(e){if(signal.aborted)throw e;return [...out.values()].map(s=>({...s,details:'error'}));}
 for(const email of emails){const shared=calendars.filter(c=>c.owner?.address?.toLowerCase()===email);if(!shared.length)continue;const details:Event[]=[];try{
  for(const cal of shared){const query=new URLSearchParams({startDateTime:new Date(start).toISOString(),endDateTime:new Date(end).toISOString(),'$select':'id,start,end,showAs,sensitivity,subject,location,bodyPreview,isAllDay,isCancelled','$top':'250'});
   const events=await g.list<GraphEvent>(`/me/calendars/${encodeURIComponent(cal.id)}/calendarView?${query}`,calendarScopes,signal);details.push(...events.filter(e=>!e.isCancelled).map(sanitize));}
  const base=out.get(email)!;
  // Keep primary-calendar free/busy authoritative; enrich only matching intervals. Custom calendars never prove primary free time.
  out.set(email,{...base,details:'available',events:base.events.map(e=>{const d=details.find(x=>x.start===e.start&&x.end===e.end);return d?{...e,...d,private:e.private||d.private,...(e.private||d.private?{subject:undefined,location:undefined,body:undefined}:{})}:e;})});
 }catch(e){if(signal.aborted)throw e;out.set(email,{...out.get(email)!,details:e instanceof GraphError&&e.status===403?'unavailable':'error'});}}
 return [...out.values()];
}
export function commonFree(schedules:Schedule[],start:number,end:number){if(!schedules.length||schedules.some(s=>s.state!=='ok'||s.events.some(e=>e.status==='unknown')))return null;const busy=schedules.flatMap(s=>s.events.filter(e=>e.status!=='free').map(e=>[Math.max(start,e.start),Math.min(end,e.end)] as const)).filter(([a,b])=>a<b).sort((a,b)=>a[0]-b[0]);const result:{start:number;end:number}[]=[];let cursor=start;for(const [a,b]of busy){if(a>cursor)result.push({start:cursor,end:a});cursor=Math.max(cursor,b);}if(cursor<end)result.push({start:cursor,end});return result;}
export function lanes(events:Event[]){const sorted=[...events].sort((a,b)=>a.start-b.start||b.end-a.end);const result:{event:Event;lane:number;count:number}[]=[];let group:typeof result=[];let maxEnd=-Infinity;const flush=()=>{const count=Math.max(1,...group.map(x=>x.lane+1));group.forEach(x=>x.count=count);result.push(...group);group=[];};for(const event of sorted){if(event.start>=maxEnd){flush();maxEnd=-Infinity;}let lane=0;while(group.some(x=>x.lane===lane&&x.event.end>event.start))lane++;group.push({event,lane,count:1});maxEnd=Math.max(maxEnd,event.end);}flush();return result;}
