import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const script = readFileSync(new URL('../_site/assets/js/reset-password.js', import.meta.url), 'utf8');
async function page(hash = '', search = '', failure = null) {
  const elements = new Map();
  const calls = [];
  const get = id => {
    if (!elements.has(id)) {
      const hidden = new Set(id === 'loading-state' ? [] : ['hidden']);
      elements.set(id, {
        value: '', disabled: true, textContent: '', handlers: {},
        classList: { add: v => hidden.add(v), remove: v => hidden.delete(v), contains: v => hidden.has(v) },
        addEventListener(name, fn) { this.handlers[name] = fn; }
      });
    }
    return elements.get(id);
  };
  const auth = {
    verifyOtp: async args => { calls.push(['verify', args]); return { error: failure, data: { session: failure ? null : {} } }; },
    setSession: async args => { calls.push(['session', args]); return { data: { session: {} } }; },
    updateUser: async args => { calls.push(['update', args]); return {}; }
  };
  let initialize;
  const context = {
    URLSearchParams, setTimeout, console: { error() {} }, alert() {},
    document: { getElementById: get, querySelectorAll: () => [], addEventListener: (_, fn) => { initialize = fn; } },
    window: { location: { hash, search, pathname: '/reset-password/' }, history: { replaceState: (...args) => calls.push(['clean', ...args]) } },
    supabase: { createClient: (_, __, options) => { assert.equal(options.auth.detectSessionInUrl, false); return { auth }; } }
  };
  vm.runInNewContext(script, context);
  await initialize();
  return { get, calls, submit: async () => {
    get('new-password').value = get('confirm-password').value = 'test-password';
    get('new-password').handlers.input();
    await get('reset-password-form').handlers.submit({ preventDefault() {} });
  } };
}

test('새 링크는 미리보기에서 인증하지 않고 제출 시 recovery 검증 후 변경한다', async () => {
  const p = await page('#token_hash=test-hash&type=recovery');
  assert.equal(p.get('form-state').classList.contains('hidden'), false);
  assert.deepEqual(p.calls.map(c => c[0]), ['clean']);
  await p.submit();
  assert.deepEqual(p.calls.map(c => c[0]), ['clean', 'verify', 'update']);
  assert.equal(p.calls[1][1].type, 'recovery');
  assert.equal(p.get('success-state').classList.contains('hidden'), false);
});
test('기존 implicit 링크로 비밀번호를 변경할 수 있다', async () => {
  const p = await page('#access_token=test&refresh_token=test-refresh&type=recovery');
  await p.submit();
  assert.deepEqual(p.calls.map(c => c[0]), ['clean', 'session', 'update']);
});
test('만료된 토큰은 비밀번호 변경을 호출하지 않는다', async () => {
  const p = await page('#token_hash=expired', '', { code: 'otp_expired' });
  await p.submit();
  assert.deepEqual(p.calls.map(c => c[0]), ['clean', 'verify']);
  assert.equal(p.get('error-state').classList.contains('hidden'), false);
});
test('fragment 및 query 오류를 표시하며 인증하지 않는다', async () => {
  for (const [hash, query] of [['#error=access_denied&error_code=otp_expired', ''], ['', '?error=access_denied&error_code=otp_expired']]) {
    const p = await page(hash, query);
    assert.equal(p.get('error-state').classList.contains('hidden'), false);
    assert.deepEqual(p.calls.map(c => c[0]), ['clean']);
  }
});
test('인증 정보가 없거나 일반 로그인 링크이면 재설정 폼을 열지 않는다', async () => {
  for (const hash of ['', '#access_token=test&refresh_token=test&type=magiclink']) {
    const p = await page(hash);
    assert.equal(p.get('info-state').classList.contains('hidden'), false);
  }
});
test('홈페이지는 recovery 및 오류 결과를 재설정 페이지로 전달한다', () => {
  const html = readFileSync(new URL('../_site/index.html', import.meta.url), 'utf8');
  const route = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  for (const hash of ['#access_token=test&type=recovery', '#error=access_denied&error_code=otp_expired', '#section']) {
    let destination;
    vm.runInNewContext(route, { URLSearchParams, window: { location: { hash, search: '', replace: value => { destination = value; } } } });
    assert.equal(destination, hash === '#section' ? undefined : '/reset-password/' + hash);
  }
});
