export type ConnectionState='idle'|'running'|'ok'|'error';
export function ConnectionResult({state,loadingText='…'}:{state:ConnectionState;loadingText?:string}){return <span role="status" aria-live="polite" className={`connection-result ${state}`}>{state==='ok'?'OK!!':state==='error'?'Error!!':state==='running'?loadingText:''}</span>;}
