export type ConnectionState='idle'|'running'|'ok'|'error';
export function ConnectionResult({state}:{state:ConnectionState}){return <span role="status" aria-live="polite" className={`connection-result ${state}`}>{state==='ok'?'OK!!':state==='error'?'Error!!':''}</span>;}
