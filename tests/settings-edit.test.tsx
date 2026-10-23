import {afterEach,it,expect,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {WorkbookSettings} from '../src/WorkbookSettings';
import {applyAuthSettings,readAuthOverride} from '../src/config';
const config={clientId:'d3975ea0-48b5-4ce9-8047-a0a0b38e5cbf',tenantId:'9c9e5e5f-2563-4959-9cfd-54536047f126'};
afterEach(()=>vi.unstubAllGlobals());
it('allows URL and ID input before sign-in while keeping authenticated save disabled',()=>{const html=renderToStaticMarkup(<WorkbookSettings value={{excelUrl:'',driveId:'',itemId:''}} language="ja" signedIn={false} onSave={()=>{}}/>);const inputs=html.match(/<input\b[^>]*>/g)||[];expect(inputs).toHaveLength(3);for(const input of inputs){expect(input).not.toContain('disabled');expect(input).not.toContain('readOnly');}expect(html).toContain('保存・読込はサインイン後');expect(html).toMatch(/<button[^>]*disabled=""[^>]*>保存・読込/);});
it('applies saved authentication settings without closing or reloading a window',async()=>{const data=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>data.get(k)||null,setItem:(k:string,v:string)=>data.set(k,v)});const reload=vi.fn(),close=vi.fn();vi.stubGlobal('location',{reload});vi.stubGlobal('window',{close});const apply=vi.fn(async()=>{});expect(await applyAuthSettings(config,false,apply)).toEqual(config);expect(readAuthOverride()).toEqual(config);expect(apply).toHaveBeenCalledWith(config);expect(reload).not.toHaveBeenCalled();expect(close).not.toHaveBeenCalled();});
