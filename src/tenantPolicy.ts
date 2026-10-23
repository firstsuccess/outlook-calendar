import type {AccountInfo,AuthenticationResult} from '@azure/msal-browser';
import type {Config} from './config';
export const organizationsAuthority='https://login.microsoftonline.com/organizations';
const guid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isMultiTenant(c:Config){return c.tenantMode!=='single';}
export function loginAuthority(c:Config){return isMultiTenant(c)?organizationsAuthority:`https://login.microsoftonline.com/${c.tenantId}`;}
export function validateOrganization(a:AccountInfo|null,c:Config){
 if(!a||!guid.test(a.tenantId)||a.tenantId==='9188040d-6c67-4c5b-b112-36a304b66dad'||!a.homeAccountId||!a.localAccountId)throw Error('Invalid organization account');
 if(!isMultiTenant(c)&&a.tenantId.toLowerCase()!==c.tenantId.toLowerCase())throw Error('Tenant mismatch');
 return a;
}
export class TenantSession{
 private pinned:AccountInfo|null=null;
 constructor(readonly config:Config){}
 bind(a:AccountInfo|null){this.pinned={...validateOrganization(a,this.config)};}
 clear(){this.pinned=null;}
 check(a:AccountInfo|null){const valid=validateOrganization(a,this.config),p=this.pinned;if(!p||valid.tenantId.toLowerCase()!==p.tenantId.toLowerCase()||valid.homeAccountId!==p.homeAccountId||valid.localAccountId!==p.localAccountId)throw Error('Account or tenant mismatch');return valid;}
 checkResult(r:AuthenticationResult){this.check(r.account);if(r.tenantId.toLowerCase()!==this.pinned!.tenantId.toLowerCase())throw Error('Token tenant mismatch');}
 authority(a:AccountInfo|null){return `https://login.microsoftonline.com/${this.check(a).tenantId}`;}
}
