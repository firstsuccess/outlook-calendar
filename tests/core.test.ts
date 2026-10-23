import {describe,it,expect} from 'vitest';
import {commonFree,dayBounds,dayList,epoch,lanes,sanitize,type Schedule,type Event} from '../src/calendar';
import {parseBook,orgIds,tableRows,orgColumns,validEmail} from '../src/model';
import {selected} from '../src/preferences';
import {retryDelay} from '../src/graph';
import {validateUrl} from '../src/excel';
const event=(start:number,end:number):Event=>({id:String(start),start,end,status:'busy',private:false});
const schedule=(events:Event[],state:Schedule['state']='ok'):Schedule=>({email:'a@example.com',state,events,details:'unavailable'});
describe('privacy and availability',()=>{
 it('strips private and confidential data',()=>{for(const sensitivity of ['private','confidential']){const e=sanitize({id:'x',start:{dateTime:'2026-10-23T01:01:00',timeZone:'UTC'},end:{dateTime:'2026-10-23T01:22:00',timeZone:'UTC'},showAs:'busy',sensitivity,subject:'secret',location:{displayName:'secret'},bodyPreview:'secret'} as never);expect(e.subject).toBeUndefined();expect(e.body).toBeUndefined();expect(e.location).toBeUndefined();expect(e.private).toBe(true);}});
 it('does not count failed or denied calendars as free',()=>{expect(commonFree([schedule([],'error')],0,100)).toBeNull();expect(commonFree([schedule([],'denied')],0,100)).toBeNull();expect(commonFree([],0,100)).toBeNull();});
 it('does not treat unknown status as free',()=>expect(commonFree([schedule([{...event(10,20),status:'unknown'}])],0,100)).toBeNull());
 it('merges exact intervals without rounding',()=>expect(commonFree([schedule([event(11,29)]),schedule([event(22,43)])],0,60)).toEqual([{start:0,end:11},{start:43,end:60}]));
 it('lays overlaps into lanes',()=>{const r=lanes([event(1,9),event(2,5),event(5,8),event(9,10)]);expect(r.map(x=>x.lane)).toEqual([0,1,1,0]);expect(r.map(x=>x.count)).toEqual([2,2,2,1]);});
 it('handles DST short and long days',()=>{let b=dayBounds('2026-03-08','America/New_York');expect(b.end-b.start).toBe(23*3600000);b=dayBounds('2026-11-01','America/New_York');expect(b.end-b.start).toBe(25*3600000);});
 it('uses Monday week start across month',()=>expect(dayList('2026-11-01',true)).toEqual(['2026-10-26','2026-10-27','2026-10-28','2026-10-29','2026-10-30','2026-10-31','2026-11-01']));
 it('rejects unexpected Graph timezone',()=>expect(()=>epoch({dateTime:'2026-10-23T00:00:00',timeZone:'Tokyo Standard Time'})).toThrow());
});
const org=(id:string,parent='',active=true)=>({OrganizationID:id,OrganizationName:id,ParentOrganizationID:parent,DisplayOrder:1,IsActive:active});
const member=(id:string,o:string,email='a@example.com')=>({MemberID:id,DisplayName:id,Email:email,Contact:'',OrganizationID:o,Position:'',DisplayOrder:1,IsActive:true});
describe('organization and selection',()=>{
 it('retains multiple assignments and hides inactive branches',()=>{const b=parseBook([org('A'),org('B','A'),org('C','',false),org('D','C')],[member('x','A'),member('x','B'),member('y','D')]);expect(b.members).toHaveLength(2);expect([...orgIds(b,'A',true)]).toEqual(['A','B']);});
 it('rejects organization cycles',()=>expect(()=>parseBook([org('A','B'),org('B','A')],[])).toThrow());
 it('rejects missing parents',()=>expect(()=>parseBook([org('A','X')],[])).toThrow());
 it('validates exact headers',()=>expect(()=>tableRows([['OrganizationID']],[],orgColumns)).toThrow());
 it('new people join all mode; deleted people never survive',()=>{expect(selected({mode:'all',emails:['old']},['new'])).toEqual(['new']);expect(selected({mode:'custom',emails:['old','new']},['new'])).toEqual(['new']);expect(selected({mode:'custom',emails:[]},['new'])).toEqual([]);});
 it('rejects empty and malformed email',()=>{expect(validEmail('')).toBe(false);expect(validEmail('not an email')).toBe(false);expect(validEmail('a@example.com')).toBe(true);});
});
describe('transport boundaries',()=>{
 it('honors retry-after without a 30 second cap',()=>expect(retryDelay('120',0)).toBe(120000));
 it('supports retry-after HTTP dates',()=>expect(retryDelay(new Date(Date.now()+90000).toUTCString(),0)).toBeGreaterThan(88000));
 it('accepts business file URLs only',()=>{expect(validateUrl('https://tenant.sharepoint.com/a.xlsx').hostname).toBe('tenant.sharepoint.com');for(const u of ['http://tenant.sharepoint.com/a.xlsx','https://sharepoint.com.attacker.test/a.xlsx','https://user:pass@tenant.sharepoint.com/a.xlsx'])expect(()=>validateUrl(u)).toThrow();});
});
