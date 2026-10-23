import {afterEach,it,expect,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {defaults,loadPreferences} from '../src/preferences';
import {ApiLimits} from '../src/ApiLimits';
afterEach(()=>vi.unstubAllGlobals());
it('disables automatic refresh including previously saved enabled preferences',()=>{expect(defaults.refresh).toBe(0);vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify({...defaults,refresh:5})});expect(loadPreferences('user').refresh).toBe(0);});
it('documents the application/mailbox and all-tenant limits in each language',()=>{for(const language of ['ja','en','zh'] as const){const html=renderToStaticMarkup(<ApiLimits language={language}/>);expect(html).toContain('10,000');expect(html).toContain('130,000');expect(html).toContain('https://learn.microsoft.com/en-us/graph/throttling-limits');}expect(renderToStaticMarkup(<ApiLimits language="ja"/>)).toContain('アプリIDとメールボックスの組み合わせ');});
