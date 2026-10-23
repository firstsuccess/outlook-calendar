import {afterEach,it,expect,vi} from 'vitest';
import {recordVisit} from '../src/VisitCounter';
afterEach(()=>vi.unstubAllGlobals());
it('sends one same-site request per page even when mounted twice',async()=>{const fetch=vi.fn(async()=>({ok:true,json:async()=>({count:100})}));vi.stubGlobal('fetch',fetch);const a=recordVisit(),b=recordVisit();expect(a).toBe(b);expect(await a).toBe(100);expect(fetch).toHaveBeenCalledTimes(1);expect(fetch.mock.calls[0]).toEqual(['/api/visit-counter',expect.objectContaining({method:'POST',credentials:'omit'})]);});
