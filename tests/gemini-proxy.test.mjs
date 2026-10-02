// Run: node tests/gemini-proxy.test.mjs
import assert from 'node:assert/strict'
import { generateKeyPair, exportJWK, SignJWT, createLocalJWKSet } from 'jose'
import { handleGemini } from '../netlify/edge-functions/gemini.js'

const PROJECT = 'test-project'
const { privateKey, publicKey } = await generateKeyPair('RS256')
const jwks = createLocalJWKSet({ keys: [{ ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256' }] })
const otherKey = (await generateKeyPair('RS256')).privateKey

function token({ aud = PROJECT, iss = `https://securetoken.google.com/${PROJECT}`, provider = 'google.com', exp = '1h', key = privateKey, sub = 'user1' } = {}) {
  return new SignJWT({ firebase: { sign_in_provider: provider } })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
    .setIssuer(iss).setAudience(aud).setSubject(sub).setIssuedAt().setExpirationTime(exp)
    .sign(key)
}
const env = (vars = { GEMINI_API_KEY: 'server-secret', VITE_FIREBASE_PROJECT_ID: PROJECT }) => ({ get: k => vars[k] })
const req = (tok, body = { model: 'gemini-3.6-flash', request: { contents: [] } }, method = 'POST') =>
  new Request('https://site/api/gemini', {
    method,
    headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) },
    ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
  })

let upstreamCalls = []
let upstreamStatus = 200
globalThis.fetch = async (url, init) => {
  upstreamCalls.push({ url: String(url), init })
  if (upstreamStatus !== 200) return new Response('{"error":{"message":"quota"}}', { status: upstreamStatus, headers: { 'content-type': 'application/json' } })
  return new Response('data: {"candidates":[{"content":{"parts":[{"text":"<html>"}]}}]}\r\n\r\n', { status: 200, headers: { 'content-type': 'text/event-stream' } })
}

const cases = [
  ['valid Google user → streamed', async () => {
    const res = await handleGemini(req(await token()), env(), jwks)
    assert.equal(res.status, 200)
    assert.match(await res.text(), /data: .*<html>/)
    const call = upstreamCalls.at(-1)
    assert.equal(call.url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:streamGenerateContent?alt=sse')
    assert.equal(call.init.headers['x-goog-api-key'], 'server-secret')
    assert.ok(!call.url.includes('server-secret'), 'key must not be in the URL')
    assert.deepEqual(JSON.parse(call.init.body), { contents: [] })
  }],
  ['no token → 401', async () => assert.equal((await handleGemini(req(null), env(), jwks)).status, 401)],
  ['token for another project → 401', async () => assert.equal((await handleGemini(req(await token({ aud: 'other' })), env(), jwks)).status, 401)],
  ['wrong issuer → 401', async () => assert.equal((await handleGemini(req(await token({ iss: 'https://evil' })), env(), jwks)).status, 401)],
  ['expired token → 401', async () => assert.equal((await handleGemini(req(await token({ exp: Math.floor(Date.now() / 1000) - 60 })), env(), jwks)).status, 401)],
  ['forged signature → 401', async () => assert.equal((await handleGemini(req(await token({ key: otherKey })), env(), jwks)).status, 401)],
  ['anonymous user → 403', async () => assert.equal((await handleGemini(req(await token({ provider: 'anonymous' })), env(), jwks)).status, 403)],
  ['model not on allowlist → 400', async () => {
    const before = upstreamCalls.length
    const res = await handleGemini(req(await token(), { model: 'gemini-ultra-expensive', request: {} }), env(), jwks)
    assert.equal(res.status, 400)
    assert.equal(upstreamCalls.length, before, 'must not call Gemini')
  }],
  ['path tricks in model → 400', async () => assert.equal((await handleGemini(req(await token(), { model: '../files', request: {} }), env(), jwks)).status, 400)],
  ['GET → 405', async () => assert.equal((await handleGemini(req(await token(), null, 'GET'), env(), jwks)).status, 405)],
  ['missing GEMINI_API_KEY → 500', async () => assert.equal((await handleGemini(req(await token()), env({ VITE_FIREBASE_PROJECT_ID: PROJECT }), jwks)).status, 500)],
  ['Gemini 429 passes through', async () => {
    upstreamStatus = 429
    const res = await handleGemini(req(await token()), env(), jwks)
    upstreamStatus = 200
    assert.equal(res.status, 429)
    assert.equal((await res.json()).error.message, 'quota')
  }],
]

let failed = 0
for (const [name, fn] of cases) {
  try { await fn(); console.log('  ok  ', name) } catch (e) { failed++; console.log('  FAIL', name, '-', e.message) }
}
console.log(`\n${cases.length - failed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
