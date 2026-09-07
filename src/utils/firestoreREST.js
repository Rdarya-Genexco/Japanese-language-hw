/**
 * Firestore REST API client — bypasses the SDK's WebChannel/gRPC connection
 * which is blocked on some networks. Uses plain HTTPS fetch instead.
 */
import { auth } from '../firebase/config'

const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/lang/documents`

// ─── Auth token ──────────────────────────────────────────────────────────────

async function token() {
  const u = auth.currentUser
  if (!u) {
    // In mock/test mode (e.g. ?mock=1) there's no real Firebase user.
    // Return a placeholder so the fetch goes through and can be intercepted
    // by a network mock (Playwright, MSW, etc.).
    if (typeof window !== 'undefined' && window.location.search.includes('mock=1')) {
      return 'mock-token'
    }
    throw new Error('Not authenticated')
  }
  return u.getIdToken()
}

// ─── JS → Firestore value ────────────────────────────────────────────────────

function toValue(v) {
  if (v === null || v === undefined) return { nullValue: null }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }
  if (typeof v === 'string') return { stringValue: v }
  if (v instanceof Date) return { timestampValue: v.toISOString() }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } }
  if (typeof v === 'object') return { mapValue: { fields: toFields(v) } }
  return { stringValue: String(v) }
}

function toFields(obj) {
  const f = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) f[k] = toValue(v)
  }
  return f
}

// ─── Firestore value → JS ────────────────────────────────────────────────────

function fromValue(v) {
  if ('nullValue' in v) return null
  if ('booleanValue' in v) return v.booleanValue
  if ('integerValue' in v) return parseInt(v.integerValue)
  if ('doubleValue' in v) return v.doubleValue
  if ('stringValue' in v) return v.stringValue
  if ('timestampValue' in v) return { seconds: Math.floor(new Date(v.timestampValue).getTime() / 1000) }
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromValue)
  if ('mapValue' in v) return fromFields(v.mapValue.fields || {})
  return null
}

function fromFields(fields) {
  const obj = {}
  for (const [k, v] of Object.entries(fields || {})) obj[k] = fromValue(v)
  return obj
}

function fromDoc(doc) {
  const id = doc.name.split('/').pop()
  return { id, ...fromFields(doc.fields) }
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function req(method, path, body) {
  const t = await token()
  const res = await fetch(`${BASE}/${path}`, {
    method,
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.error?.message || `HTTP ${res.status}`
    const code = (err?.error?.status || 'UNKNOWN').toLowerCase().replace(/_/g, '-')
    const e = new Error(msg)
    e.code = code
    throw e
  }
  return res.json()
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Create a document with auto-generated ID. Returns the new doc ID. */
export async function restAdd(collection, data) {
  const result = await req('POST', collection, { fields: toFields(data) })
  return result.name.split('/').pop()
}

/** Set (overwrite) a document at a specific ID. */
export async function restSet(collection, id, data) {
  await req('PATCH', `${collection}/${id}`, { fields: toFields(data) })
}

/** Get a single document. Returns null if not found. */
export async function restGet(collection, id) {
  try {
    const result = await req('GET', `${collection}/${id}`)
    return fromDoc(result)
  } catch (err) {
    if (err.code === 'not-found') return null
    throw err
  }
}

/** Partial-update (merge) a document — only named fields are changed. */
export async function restUpdate(collection, id, data) {
  const fields = toFields(data)
  const mask = Object.keys(data).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&')
  const t = await token()
  const res = await fetch(`${BASE}/${collection}/${id}?${mask}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.error?.message || `HTTP ${res.status}`
    const code = (err?.error?.status || 'UNKNOWN').toLowerCase().replace(/_/g, '-')
    const e = new Error(msg)
    e.code = code
    throw e
  }
  return res.json()
}

/** Delete a document. */
export async function restDelete(collection, id) {
  const t = await token()
  const res = await fetch(`${BASE}/${collection}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${t}` },
  })
  if (!res.ok && res.status !== 404) throw new Error(`Delete failed: ${res.status}`)
}

/** List ALL documents in a collection (no filter). */
export async function restList(collection) {
  const t = await token()
  const res = await fetch(`${BASE}/${collection}`, {
    headers: { Authorization: `Bearer ${t}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `List failed: ${res.status}`)
  }
  const data = await res.json()
  return (data.documents || []).map(fromDoc)
}

/** Query a collection by a single field equality filter. */
export async function restQuery(collection, field, value) {
  const parts = collection.split('/')
  const collectionId = parts[parts.length - 1]
  const parent = parts.slice(0, -1).join('/')

  const t = await token()
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/lang/documents/${parent}:runQuery`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId }],
          where: { fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: toValue(value) } },
        },
      }),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Query failed: ${res.status}`)
  }
  const rows = await res.json()
  return rows.filter(r => r.document).map(r => fromDoc(r.document))
}
