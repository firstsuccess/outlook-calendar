import {PublicClientApplication,InteractionRequiredAuthError,type AccountInfo} from '@azure/msal-browser';
import {validateConfig,getRedirectUri,type Config} from './config';
import {TenantSession,loginAuthority,validateOrganization} from './tenantPolicy';
export class Auth {
 readonly app:PublicClientApplication;
 readonly session:TenantSession;
 constructor(readonly config:Config){
  validateConfig(config);
  this.session=new TenantSession(config);
  this.app=new PublicClientApplication({auth:{clientId:config.clientId,authority:loginAuthority(config),redirectUri:getRedirectUri(config)},cache:{cacheLocation:'memoryStorage'},system:{loggerOptions:{piiLoggingEnabled:false,loggerCallback:()=>{}}}});
 }
 async init(){await this.app.initialize();}
 get account(){return this.app.getActiveAccount();}
 async login(){const r=await this.app.loginPopup({scopes:['User.Read'],prompt:'select_account'});validateOrganization(r.account,this.config);this.session.bind(r.account);try{this.session.checkResult(r);this.app.setActiveAccount(r.account);}catch(e){this.session.clear();throw e;}}
 check(a:AccountInfo|null){this.session.check(a);}
 async consent(scopes:string[]){const account=this.account;const authority=this.session.authority(account);const r=await this.app.acquireTokenPopup({scopes,account:account!,authority});this.session.check(this.account);this.session.checkResult(r);}
 async token(scopes:string[],forceRefresh=false){const account=this.account;const authority=this.session.authority(account);try{const r=await this.app.acquireTokenSilent({scopes,account:account!,authority,forceRefresh});this.session.check(this.account);this.session.checkResult(r);return r.accessToken;}catch(e){if(e instanceof InteractionRequiredAuthError)throw Error('CONSENT_REQUIRED');throw e;}}
 async logout(){const account=this.account;this.session.clear();await this.app.logoutPopup({account,mainWindowRedirectUri:location.origin});}
}
