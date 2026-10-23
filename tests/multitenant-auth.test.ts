import {beforeEach,it,expect,vi} from 'vitest';
import type {AccountInfo,AuthenticationResult} from '@azure/msal-browser';
const state=vi.hoisted(()=>({active:null as unknown,login:null as unknown,result:null as unknown,config:null as any,popup:vi.fn(),silent:vi.fn()}));
vi.mock('@azure/msal-browser',()=>({InteractionRequiredAuthError:class extends Error{},PublicClientApplication:class{
 constructor(c:unknown){state.config=c;}
 async initialize(){}
 getActiveAccount(){return state.active;}
 setActiveAccount(a:unknown){state.active=a;}
 async loginPopup(){return state.login;}
 async acquireTokenPopup(request:unknown){state.popup(request);return state.result;}
 async acquireTokenSilent(request:unknown){state.silent(request);return state.result;}
}}));
import {Auth} from '../src/auth';
const publisher='9c9e5e5f-2563-4959-9cfd-54536047f126',customer='12345678-1234-1234-1234-123456789abc';
const config={clientId:'d3975ea0-48b5-4ce9-8047-a0a0b38e5cbf',tenantId:publisher};
const account=(tenantId:string)=>({tenantId,homeAccountId:'user.home',localAccountId:'user',username:'u@example.com',environment:'login.windows.net'}) as AccountInfo;
const result=(tenantId:string)=>({account:account(tenantId),tenantId,accessToken:'mock-token'}) as AuthenticationResult;
beforeEach(()=>{vi.stubGlobal('location',{origin:'https://calendar.example'});state.active=null;state.login=result(customer);state.result=result(customer);state.popup.mockClear();state.silent.mockClear();});
it('logs a customer in with the shared app ID, then uses only the customer authority for consent and Graph tokens',async()=>{const auth=new Auth(config);await auth.init();await auth.login();expect(state.config.auth.clientId).toBe(config.clientId);expect(state.config.auth.authority).toBe('https://login.microsoftonline.com/organizations');await auth.consent(['Files.Read.All']);expect(state.popup).toHaveBeenCalledWith(expect.objectContaining({authority:`https://login.microsoftonline.com/${customer}`,account:account(customer)}));expect(await auth.token(['Files.Read.All'])).toBe('mock-token');expect(state.silent).toHaveBeenCalledWith(expect.objectContaining({authority:`https://login.microsoftonline.com/${customer}`,account:account(customer)}));});
it('rejects a response from another tenant instead of returning its token',async()=>{const auth=new Auth(config);await auth.login();state.result=result(publisher);await expect(auth.token(['Files.Read.All'])).rejects.toThrow('mismatch');await expect(auth.consent(['Files.Read.All'])).rejects.toThrow('mismatch');});
it('rejects an unexpected active-account switch before requesting a token',async()=>{const auth=new Auth(config);await auth.login();state.active=account(publisher);await expect(auth.token(['Files.Read.All'])).rejects.toThrow('mismatch');expect(state.silent).not.toHaveBeenCalled();});

it('restores the cached active account and validates its tenant before use',async()=>{state.active=account(customer);const auth=new Auth(config);await auth.init();expect(state.config.cache.cacheLocation).toBe('localStorage');expect(auth.account).toEqual(account(customer));expect(await auth.token(['Files.Read.All'])).toBe('mock-token');});
it('discards a restored account when token tenant validation fails',async()=>{state.active=account(customer);state.result=result(publisher);const auth=new Auth(config);await auth.init();expect(auth.account).toBeNull();});
it('does not select another cached identity without an active account',async()=>{const auth=new Auth(config);await auth.init();expect(auth.account).toBeNull();expect(state.silent).not.toHaveBeenCalled();});
