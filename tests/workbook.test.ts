import {afterEach,it,expect,vi} from 'vitest';
import {applyReference,preferencesKey,validateReference,workbookReference} from '../src/workbook';
import {defaults,loadPreferences} from '../src/preferences';
afterEach(()=>vi.unstubAllGlobals());
it('stores references separately for different users and tenants',()=>{
 const data=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(key:string)=>data.get(key)||null});
 const first={...defaults,personalUrl:'https://a.sharepoint.com/A.xlsx',personalDriveId:'drive-a',personalItemId:'item-a'};
 const second={...defaults,personalUrl:'https://b.sharepoint.com/B.xlsx'};
 data.set(preferencesKey('tenant-a','user-a'),JSON.stringify(first));data.set(preferencesKey('tenant-a','user-b'),JSON.stringify(second));
 expect(workbookReference(loadPreferences(preferencesKey('tenant-a','user-a')))).toEqual({excelUrl:first.personalUrl,driveId:'drive-a',itemId:'item-a'});
 expect(loadPreferences(preferencesKey('tenant-a','user-b')).personalUrl).toBe(second.personalUrl);
 expect(loadPreferences(preferencesKey('tenant-b','user-a')).personalUrl).toBe('');
});
it('changing or removing a workbook clears department and employee selections',()=>{const p={...defaults,org:'old',selections:{old:{mode:'all' as const,emails:['old@example.com']}}};const next=applyReference(p,{excelUrl:'https://tenant.sharepoint.com/new.xlsx',driveId:'',itemId:''});expect(next.org).toBe('');expect(next.selections).toEqual({});expect(next.start).toBe(p.start);expect(applyReference(next,{excelUrl:'',driveId:'',itemId:''}).personalUrl).toBe('');});
it('validates drafts before saving and requires paired sharing-link IDs',()=>{expect(validateReference({excelUrl:' https://tenant.sharepoint.com/a.xlsx ',driveId:'',itemId:''}).excelUrl).toBe('https://tenant.sharepoint.com/a.xlsx');expect(()=>validateReference({excelUrl:'https://tenant.sharepoint.com/:x:/s/token',driveId:'',itemId:''})).toThrow('DIRECT_URL_REQUIRED');expect(()=>validateReference({excelUrl:'https://tenant.sharepoint.com/a.xlsx',driveId:'one',itemId:''})).toThrow('IDS_REQUIRED');expect(validateReference({excelUrl:'https://tenant.sharepoint.com/:x:/s/token',driveId:'one',itemId:'two'}).itemId).toBe('two');expect(()=>validateReference({excelUrl:'https://evil.test/a.xlsx',driveId:'',itemId:''})).toThrow();});
