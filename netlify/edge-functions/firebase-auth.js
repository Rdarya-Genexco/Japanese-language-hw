/**
 * Serves Firebase's sign-in helper (/__/auth/*) from this site's own domain, so Google's account
 * chooser says "continue to doc-translate.netlify.app" rather than the firebaseapp.com address.
 * The target comes from the VITE_FIREBASE_AUTH_DOMAIN env var, so no Firebase value sits in the repo
 * (Netlify's secret scan fails the build when one does).
 */
export async function proxyFirebaseAuth(req, env) {
  const authDomain = env.get('VITE_FIREBASE_AUTH_DOMAIN')
  if (!authDomain) return new Response('Sign-in is not configured on the server.', { status: 500 })

  const url = new URL(req.url)
  if (!url.pathname.startsWith('/__/auth/')) return new Response('Not found', { status: 404 })

  const headers = new Headers(req.headers)
  for (const h of ['host', 'connection', 'content-length', 'accept-encoding']) headers.delete(h)

  let upstream
  try {
    upstream = await fetch(`https://${authDomain}${url.pathname}${url.search}`, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer(),
      redirect: 'manual',
    })
  } catch {
    return new Response('Could not reach the sign-in service. Please try again.', { status: 502 })
  }

  // fetch() has already decoded the body, so drop the encoding/length headers that described it
  const out = new Headers(upstream.headers)
  for (const h of ['content-encoding', 'content-length', 'transfer-encoding', 'connection']) out.delete(h)
  return new Response(upstream.body, { status: upstream.status, headers: out })
}

export default (req) => proxyFirebaseAuth(req, Netlify.env)

export const config = { path: '/__/auth/*' }
