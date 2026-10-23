import {GraphError} from './graph';
export function safeErrorCode(error:unknown):string{
 if(error instanceof GraphError)return `Graph ${error.status}`;
 if(error instanceof Error&&error.message==='CONSENT_REQUIRED')return 'CONSENT_REQUIRED';
 if(!error||typeof error!=='object')return 'REQUEST_FAILED';
 const e=error as {errorCode?:unknown;errorMessage?:unknown;message?:unknown};
 const code=typeof e.errorCode==='string'&&/^[a-z][a-z0-9_]{0,63}$/i.test(e.errorCode)?e.errorCode:'';
 const message=typeof e.errorMessage==='string'?e.errorMessage:typeof e.message==='string'?e.message:'';
 const aad=message.match(/\bAADSTS\d{4,10}\b/)?.[0];
 return [code,aad].filter(Boolean).join(' / ')||'REQUEST_FAILED';
}
export function errorAdvice(code:string,language:'ja'|'en'|'zh'){
 const hint=code.includes('AADSTS50011')?'redirect':/popup_window_error|empty_window_error|block_nested_popups/.test(code)?'popup':/monitor_.*timeout|hash_empty_error/.test(code)?'timeout':/AADSTS700016|AADSTS90002|invalid_client|unauthorized_client/.test(code)?'ids':/AADSTS65001|consent_required|CONSENT_REQUIRED/.test(code)?'consent':code.includes('interaction_in_progress')?'progress':'';
 const messages={
 ja:{redirect:'Entraの認証設定で、このサイトのルートURLをSPAリダイレクトURIとして登録してください。',popup:'ポップアップを許可してください。アプリ内ブラウザで開けない場合は、EdgeまたはChromeで同じURLを開いてください。',timeout:'認証画面の完了・ポップアップ制限・SPAリダイレクトURI・ネットワーク接続を確認してください。',ids:'設定画面のアプリケーションIDとテナントID、および対象テナントでのアプリ登録を確認してください。',consent:'必要な委任権限への同意を確認してください。組織ポリシーで必要な場合は管理者へ確認してください。',progress:'別の認証操作が進行中です。完了後に再試行してください。'},
 en:{redirect:'Register this site root URL as a SPA redirect URI in Entra.',popup:'Allow popups. If the in-app browser cannot open sign-in, open the same URL in Edge or Chrome.',timeout:'Check completion of the sign-in window, popup restrictions, SPA redirect URI and network connection.',ids:'Check the application ID, tenant ID and app registration in the selected tenant.',consent:'Check consent for the required delegated permissions; ask your administrator if tenant policy requires it.',progress:'Another authentication operation is in progress. Wait for it to finish.'},
 zh:{redirect:'请将本站根地址注册为 Entra SPA 重定向 URI。',popup:'请允许弹窗。如果应用内浏览器无法登录，请在 Edge 或 Chrome 中打开相同地址。',timeout:'请检查登录窗口是否完成、弹窗限制、SPA 重定向 URI 及网络连接。',ids:'请检查应用程序 ID、租户 ID 及目标租户中的应用注册。',consent:'请检查所需委托权限的同意；若租户策略要求，请联系管理员。',progress:'另一个认证操作正在进行，请等待其完成。'}
 };return hint?messages[language][hint as keyof typeof messages.ja]:'';
}
