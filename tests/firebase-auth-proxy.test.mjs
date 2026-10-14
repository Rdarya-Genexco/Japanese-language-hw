// Tests for netlify/edge-functions/firebase-auth.js against a stand-in for Firebase (no network).
import { proxyFirebaseAuth } from '../netlify/edge-functions/firebase-auth.js'
const env = { get: k => (k === 'VITE_FIREBASE_AUTH_DOMAIN' ? 'example-auth.firebaseapp.com' : undefined) }
const calls = []
globalThis.fetch = async (url, init) => {
  calls.push({ url, method: init.method, host: init.headers.get('host'), enc: init.headers.get('accept-encoding'), cookie: init.headers.get('cookie'), redirect: init.redirect, body: init.body && new TextDecoder().decode(init.body) })
  if (url.includes('/redirect')) return new Response(null, { status: 302, headers: { location: 'https://accounts.google.com/o/oauth2/auth?x=1' } })
  return new Response('<html>handler</html>', { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'content-encoding': 'gzip', 'content-length': '999', 'cache-control': 'no-cache', 'set-cookie': 'a=b' } })
}
let ok = 0, bad = 0
const t = (n, c) => {
  if (c) ok++
  else bad++
  console.log(c ? '  ok  ' : '  FAIL', n)
}
let r = await proxyFirebaseAuth(new Request('https://doc-translate.netlify.app/__/auth/handler?apiKey=k&authType=signInViaPopup', { headers: { host: 'doc-translate.netlify.app', 'accept-encoding': 'gzip, br', cookie: 'c=1' } }), env)
t('forwards path + query to the auth domain', calls[0].url === 'https://example-auth.firebaseapp.com/__/auth/handler?apiKey=k&authType=signInViaPopup')
t('drops Host and Accept-Encoding, keeps cookies', calls[0].host === null && calls[0].enc === null && calls[0].cookie === 'c=1')
t('returns status and body', r.status === 200 && (await r.text()) === '<html>handler</html>')
t('strips stale content-encoding/length, keeps type/cache/cookie', r.headers.get('content-encoding') === null && r.headers.get('content-length') === null && r.headers.get('content-type').startsWith('text/html') && r.headers.get('cache-control') === 'no-cache' && r.headers.get('set-cookie') === 'a=b')
r = await proxyFirebaseAuth(new Request('https://doc-translate.netlify.app/__/auth/redirect'), env)
t('passes redirects to the browser (manual)', calls[1].redirect === 'manual' && r.status === 302 && r.headers.get('location').startsWith('https://accounts.google.com'))
r = await proxyFirebaseAuth(new Request('https://doc-translate.netlify.app/__/auth/handler', { method: 'POST', body: 'x=1' }), env)
t('forwards POST bodies', calls[2].method === 'POST' && calls[2].body === 'x=1')
r = await proxyFirebaseAuth(new Request('https://doc-translate.netlify.app/__/other'), env)
t('only /__/auth/* is proxied', r.status === 404 && calls.length === 3)
globalThis.fetch = async () => { throw new Error('down') }
r = await proxyFirebaseAuth(new Request('https://doc-translate.netlify.app/__/auth/handler'), env)
t('upstream down → 502', r.status === 502)
r = await proxyFirebaseAuth(new Request('https://doc-translate.netlify.app/__/auth/handler'), { get: () => undefined })
t('env var missing → 500', r.status === 500)
console.log(`\n${ok} passed, ${bad} failed`)
process.exit(bad ? 1 : 0)
