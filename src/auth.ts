import {PublicClientApplication,InteractionRequiredAuthError,type AccountInfo} from '@azure/msal-browser';
import type {Config} from './config';
export class Auth {
 readonly app:PublicClientApplication;
 constructor(readonly config:Config){
  if(!/^[0-9a-f-]{36}$/i.test(config.clientId)||!/^[0-9a-f-]{36}$/i.test(config.tenantId))throw Error('Configure Entra clientId / tenantId');
  this.app=new PublicClientApplication({auth:{clientId:config.clientId,authority:`https://login.microsoftonline.com/${config.tenantId}`,redirectUri:new URL('/',location.origin).href},cache:{cacheLocation:'memoryStorage'},system:{loggerOptions:{piiLoggingEnabled:false,loggerCallback:()=>{}}}});
 }
 async init(){await this.app.initialize();}
 get account(){return this.app.getActiveAccount();}
 async login(){const r=await this.app.loginPopup({scopes:['User.Read']});this.check(r.account);this.app.setActiveAccount(r.account);}
 check(a:AccountInfo|null){if(!a||a.tenantId.toLowerCase()!==this.config.tenantId.toLowerCase())throw Error('Tenant mismatch');}
 async consent(scopes:string[]){const r=await this.app.acquireTokenPopup({scopes,account:this.account||undefined});this.check(r.account);}
 async token(scopes:string[],forceRefresh=false){this.check(this.account);try{return (await this.app.acquireTokenSilent({scopes,account:this.account!,forceRefresh})).accessToken;}catch(e){if(e instanceof InteractionRequiredAuthError)throw Error('CONSENT_REQUIRED');throw e;}}
 async logout(){await this.app.logoutPopup({account:this.account,mainWindowRedirectUri:location.origin});}
}
