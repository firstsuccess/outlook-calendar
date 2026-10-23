import {it,expect} from 'vitest';
import {safeErrorCode,errorAdvice} from '../src/errors';
it('shows MSAL and AADSTS codes without raw sensitive error text',()=>{const code=safeErrorCode({errorCode:'invalid_client',errorMessage:'AADSTS700016: secret person@example.com token=secret'});expect(code).toBe('invalid_client / AADSTS700016');expect(code).not.toContain('secret');expect(code).not.toContain('@');});
it('does not echo arbitrary messages or malformed codes',()=>{expect(safeErrorCode(Error('secret'))).toBe('REQUEST_FAILED');expect(safeErrorCode({errorCode:'<script>secret</script>'})).toBe('REQUEST_FAILED');});
it('provides targeted popup and redirect guidance',()=>{expect(errorAdvice('popup_window_error','ja')).toContain('Edge');expect(errorAdvice('invalid_request / AADSTS50011','ja')).toContain('SPA');});
