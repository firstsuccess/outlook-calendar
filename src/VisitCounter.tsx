import {useEffect,useState} from 'react';
let visit:Promise<number>|undefined;
export function recordVisit(){return visit??=fetch('/api/visit-counter',{method:'POST',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(15000)}).then(async response=>{if(!response.ok)throw Error('Counter unavailable');const data=await response.json();if(!Number.isSafeInteger(data.count)||data.count<100)throw Error('Invalid counter');return data.count as number;});}
export function VisitCounter(){const [count,setCount]=useState<number>();useEffect(()=>{let live=true;recordVisit().then(n=>{if(live)setCount(n);}).catch(()=>{});return()=>{live=false;};},[]);return <span className="visit-counter" aria-label="Access count">{count===undefined?'—':count.toLocaleString('en-US')}</span>;}
