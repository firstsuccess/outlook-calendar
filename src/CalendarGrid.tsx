import {useState} from 'react';
import {offsetRange} from './timezone';
import type {Member} from './model';
import {atTime,lanes,commonFree,type Schedule,type Event} from './calendar';
import type {Preferences} from './preferences';
import type {Text} from './i18n';
export function CalendarGrid({members,schedules,days,p,t,zone,loading}:{members:Member[];schedules:Schedule[];days:string[];p:Preferences;t:Text;zone:string;loading:boolean}){
 const [detail,setDetail]=useState<Event|null>(null);
 const rows=p.orientation==='rows';
 const time=(ms:number)=>new Intl.DateTimeFormat(p.language,{hour:'2-digit',minute:'2-digit',timeZone:zone}).format(ms);
 return <><div className="calendar-scroll" aria-busy={loading} key={`${p.orientation}-${days.join()}`}>
 {!members.length?<div className="empty">{t.empty}</div>:days.map(day=>{
  const from=atTime(day,p.start,zone),to=atTime(day,p.end,zone),span=to-from;
  const ticks=Array.from({length:Math.floor(span/(p.interval*60000))+1},(_,i)=>from+i*p.interval*60000);
  const free=commonFree(schedules,from,to);
  return <section className="calendar-day" key={day}><h2>{day} · {zone} ({offsetRange(day,zone)})</h2><div className="common"><strong>{t.common}: </strong>{loading?t.loading:free===null?t.unconfirmed:free.length?free.map(f=>`${time(f.start)}–${time(f.end)}`).join(' / '):t.noFree}</div>
  <div className={rows?'grid rows':'grid columns'} style={rows?{minWidth:900}:{gridTemplateColumns:`64px repeat(${members.length},minmax(180px,1fr))`}}>
   {rows?<><div className="corner">{zone}</div><div className="horizontal-axis">{ticks.map(ms=><span key={ms} style={{left:`${(ms-from)/span*100}%`}}>{time(ms)}</span>)}</div></>:<><div className="corner">{zone}</div>{members.map(m=><div key={m.email} className="person-header" title={m.email}>{m.name}<small>{m.position}</small></div>)}</>}
   {!rows&&<div className="vertical-axis" style={{height:Math.max(480,span/60000*1.3)}}>{ticks.map(ms=><span key={ms} style={{top:`${(ms-from)/span*100}%`}}>{time(ms)}</span>)}</div>}
   {members.map(m=>{const schedule=schedules.find(s=>s.email===m.email);const events=(schedule?.events||[]).filter(e=>e.start<to&&e.end>from);const blocks=lanes(events);return <div className={rows?'person-row':'person-column'} key={m.email} style={rows?undefined:{height:Math.max(480,span/60000*1.3)}}>
    {rows&&<div className="row-name" title={m.email}>{m.name}<small>{m.position}</small></div>}
    <div className="track" style={rows?{height:Math.max(110,...blocks.map(b=>b.count*38+30))}:undefined}>
     {ticks.map(ms=><div key={ms} className="grid-line" style={rows?{left:`${(ms-from)/span*100}%`}:{top:`${(ms-from)/span*100}%`}}/>)}
     {free?.map((f,i)=><div key={`free-${i}`} className="free-band" style={rows?{left:`${(f.start-from)/span*100}%`,width:`${(f.end-f.start)/span*100}%`}:{top:`${(f.start-from)/span*100}%`,height:`${(f.end-f.start)/span*100}%`}}/>)}
     {loading?<div className="track-status">{t.loading}</div>:!schedule||schedule.state!=='ok'?<div className="track-status error">{schedule?.state==='denied'?t.denied:t.error}</div>:<>
      <div className="detail-state">{schedule.details==='available'?'':schedule.details==='error'?t.detailsError:t.noDetails}</div>
      {blocks.map(({event:e,lane,count})=>{const a=Math.max(e.start,from),b=Math.min(e.end,to);const label=e.private?t.private:e.subject||t[e.status];const style=rows?{left:`${(a-from)/span*100}%`,width:`${(b-a)/span*100}%`,top:26+lane*38,height:34}:{top:`${(a-from)/span*100}%`,height:`${(b-a)/span*100}%`,left:`${lane/count*100}%`,width:`${100/count}%`};return <button className={`event ${e.status} ${e.private?'private':''}`} key={e.id} style={style} title={`${time(e.start)}–${time(e.end)} ${label}${!e.private&&e.location?' / '+e.location:''}`} onClick={()=>setDetail(e)}><strong>{label}</strong><small>{e.allDay?t.allDay:`${time(e.start)}–${time(e.end)}`}</small></button>;})}
     </>}
    </div></div>;})}
  </div></section>;
 })}</div>
 {detail&&<div className="modal-backdrop"><section role="dialog" aria-modal="true" aria-label={t.details} className="modal"><button className="close" onClick={()=>setDetail(null)}>{t.close}</button><h2>{detail.private?t.private:detail.subject||t[detail.status]}</h2><p>{new Intl.DateTimeFormat(p.language,{dateStyle:'medium',timeStyle:'short',timeZone:zone}).format(detail.start)} – {time(detail.end)}</p><p>{t[detail.status]}</p>{!detail.private&&<><p>{detail.location}</p><p className="body-preview">{detail.body}</p></>}</section></div>}
 </>;
}
