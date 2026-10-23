import {it,expect} from 'vitest';
import {effectiveZone,offsetRange,validZone} from '../src/timezone';
import {dayBounds,atTime} from '../src/calendar';
it('supports positive, negative and half-hour UTC offsets',()=>{expect(offsetRange('2026-01-15','Asia/Tokyo')).toBe('UTC+09:00');expect(offsetRange('2026-01-15','Asia/Kolkata')).toBe('UTC+05:30');expect(offsetRange('2026-01-15','America/New_York')).toBe('UTC-05:00');});
it('updates offsets for summer time and shows both offsets on transition day',()=>{expect(offsetRange('2026-07-15','America/New_York')).toBe('UTC-04:00');expect(offsetRange('2026-03-08','America/New_York')).toBe('UTC-05:00 → UTC-04:00');expect(offsetRange('2026-11-01','America/New_York')).toBe('UTC-04:00 → UTC-05:00');});
it('uses the selected zone for query boundaries and display hours',()=>{expect(dayBounds('2026-10-23','Asia/Tokyo').start).toBe(Date.parse('2026-10-22T15:00:00Z'));expect(atTime('2026-10-23',9,'Asia/Tokyo')).toBe(Date.parse('2026-10-23T00:00:00Z'));expect(dayBounds('2026-10-23','America/New_York').start).not.toBe(dayBounds('2026-10-23','Asia/Tokyo').start);});
it('rejects invalid saved zones and falls back to browser zone',()=>{expect(validZone('not/a-zone')).toBe(false);expect(effectiveZone('not/a-zone')).toBe(effectiveZone('system'));});
