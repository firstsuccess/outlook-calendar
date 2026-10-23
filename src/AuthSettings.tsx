import {useState} from 'react';
import {saveAuthOverride,resetAuthOverride,type Config} from './config';
import type {Language} from './preferences';
const text={
 ja:{title:'Microsoft 365 認証設定',client:'アプリケーションID（Client ID）',tenant:'テナントID（Tenant ID）',hint:'サインイン前でも変更できます。保存した設定はこのブラウザで使用します。変更後は画面を再読込し、新しい設定でサインインし直します。',save:'認証設定を保存・適用',reset:'公開サイトの初期設定に戻す',invalid:'有効なGUID形式のIDを入力してください。保存できない場合はブラウザの保存設定も確認してください。',redirect:'使用するEntraアプリに、次のURLをSPAリダイレクトURIとして登録してください。'},
 en:{title:'Microsoft 365 authentication settings',client:'Application ID (Client ID)',tenant:'Tenant ID',hint:'You can change these before signing in. Settings apply to this browser. Applying changes reloads the page and requires a new sign-in.',save:'Save & apply authentication',reset:'Restore site defaults',invalid:'Enter valid GUID IDs. If saving fails, check browser storage settings.',redirect:'Register this URL as a SPA redirect URI in the Entra application you use.'},
 zh:{title:'Microsoft 365 认证设置',client:'应用程序 ID（Client ID）',tenant:'租户 ID（Tenant ID）',hint:'登录前也可更改。设置仅用于此浏览器。应用更改后将重新加载页面，需使用新设置重新登录。',save:'保存并应用认证设置',reset:'恢复网站初始设置',invalid:'请输入有效 GUID 格式的 ID。若保存失败，请检查浏览器存储设置。',redirect:'请在使用的 Entra 应用中将以下地址注册为 SPA 重定向 URI。'}
};
export function AuthSettings({config,language}:{config:Config|null;language:Language}){
 const [draft,setDraft]=useState<Config>(config||{clientId:'',tenantId:''}),[error,setError]=useState(false);const t=text[language];
 function apply(reset=false){try{if(reset)resetAuthOverride();else saveAuthOverride(draft);location.reload();}catch{setError(true);}}
 return <section className="auth-settings"><h2>{t.title}</h2><p>{t.hint}</p><label>{t.client}<input autoComplete="off" spellCheck={false} value={draft.clientId} onChange={e=>{setError(false);setDraft({...draft,clientId:e.target.value});}}/></label><label>{t.tenant}<input autoComplete="off" spellCheck={false} value={draft.tenantId} onChange={e=>{setError(false);setDraft({...draft,tenantId:e.target.value});}}/></label><div className="selection-actions"><button className="primary" onClick={()=>apply()}>{t.save}</button><button onClick={()=>apply(true)}>{t.reset}</button></div>{error&&<p className="warning" role="alert">{t.invalid}</p>}<p>{t.redirect}<br/><code>{location.origin}/</code></p><hr/></section>;
}
