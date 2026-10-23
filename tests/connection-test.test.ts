import {it,expect} from 'vitest';
import {connectionProblem} from '../src/connectionTest';
it('explains why an unsigned-in user cannot test instead of silently ignoring the click',()=>expect(connectionProblem(false,'',false,'ja')).toContain('サインイン'));
it('requires a saved URL and then permission, with a specific next action',()=>{expect(connectionProblem(true,'',false,'ja')).toContain('保存・読込');expect(connectionProblem(true,'https://tenant.sharepoint.com/a.xlsx',false,'ja')).toContain('読取を許可');expect(connectionProblem(true,'https://tenant.sharepoint.com/a.xlsx',true,'ja')).toBe('');});
