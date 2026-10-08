/**
 * Gemini proxy: keeps GEMINI_API_KEY on the server. Only signed-in (non-anonymous) Firebase users
 * of this project may call it, and only for the app's models. The reply is streamed straight
 * through, so long worksheets don't hit a function timeout.
 */
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { MODEL_CHAIN } from '../../src/utils/geminiModels.js'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
)

function error(status, message) {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

export async function handleGemini(req, env, jwks = FIREBASE_JWKS) {
  if (req.method !== 'POST') return error(405, 'Method not allowed.')

  const apiKey = env.get('GEMINI_API_KEY')
  const projectId = env.get('VITE_FIREBASE_PROJECT_ID')
  if (!apiKey || !projectId) return error(500, 'AI is not configured on the server (GEMINI_API_KEY is missing).')

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return error(401, 'Please sign in to use AI.')
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    })
    if (!payload.sub) return error(401, 'Please sign in to use AI.')
    if (payload.firebase?.sign_in_provider === 'anonymous') return error(403, 'Sign in with Google to use AI.')
  } catch {
    return error(401, 'Your sign-in has expired. Please sign in again.')
  }

  let input
  try {
    input = await req.json()
  } catch {
    return error(400, 'Invalid request.')
  }
  if (!MODEL_CHAIN.includes(input?.model) || typeof input?.request !== 'object' || !input.request) {
    return error(400, 'Unknown model.')
  }

  let upstream
  try {
    upstream = await fetch(`${GEMINI_BASE}/${input.model}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(input.request),
    })
  } catch {
    return error(502, 'Could not reach the AI service. Please try again.')
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}

// GEMINI_API_KEY and VITE_FIREBASE_PROJECT_ID come from Netlify's environment variables (never stored in code).
export default (req) => handleGemini(req, Netlify.env)

export const config = { path: '/api/gemini' }
