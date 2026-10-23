import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import {strings} from './i18n';
import type {Language} from './preferences';
import './style.css';
function Launcher(){const [lang,setLang]=useState<Language>('ja');const t=strings[lang];const url=new URL(import.meta.env.VITE_PUBLIC_URL||'/',location.origin).href;function open(){Office.onReady(()=>{if(Office.context.requirements.isSetSupported('OpenBrowserWindowApi','1.1'))Office.context.ui.openBrowserWindow(url);else Office.context.ui.displayDialogAsync(url,{height:80,width:80,displayInIframe:false},()=>{});});}return <section className="launcher"><select aria-label="Language" value={lang} onChange={e=>setLang(e.target.value as Language)}><option value="ja">日本語</option><option value="en">English</option><option value="zh">简体中文</option></select><h1>{t.title}</h1><p>{t.security}</p><button className="primary" onClick={open}>{t.open}</button><p>{t.fallback}</p><a href={url} target="_blank" rel="noopener noreferrer">{t.open}</a></section>;}
createRoot(document.getElementById('root')!).render(<Launcher/>);
