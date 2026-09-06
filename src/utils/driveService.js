/**
 * Google Drive data layer — replaces Firestore entirely.
 * All data lives in the authenticated user's own Google Drive.
 * Requires the 'drive.file' OAuth scope added to GoogleAuthProvider in config.js.
 *
 * Folder structure in Drive:
 *   My Drive / ワークシート /          ← app root (created on first use)
 *     [user folders] /                 ← Drive folders  (id = app folderId)
 *       [worksheet title].json         ← worksheet content as JSON
 *     _gemini_key.json                 ← stored API key (if used)
 *
 * appProperties limits: max 30 props, each value ≤ 124 bytes.
 * Worksheet name lives in the Drive file NAME (no byte limit there).
 */
import { auth, googleProvider } from '../firebase/config'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'

const DRIVE  = 'https://www.googleapis.com/drive/v3'
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3'
const APP_FOLDER = 'ワークシート'
const BOUNDARY   = 'drive_mp_boundary_7f3k'

// ─── Token management ─────────────────────────────────────────────────────────

let _tok    = null
let _tokExp = 0

/** Called from AuthContext after signInWithPopup to store the fresh OAuth token. */
export function setDriveToken(token) {
  _tok    = token
  _tokExp = Date.now() + 55 * 60 * 1000   // 55 min (tokens last ~60 min)
  try {
    localStorage.setItem('_drv_tok', token)
    localStorage.setItem('_drv_exp', String(_tokExp))
  } catch {}
}

/** Returns true if we have a non-expired cached token (no network call). */
export function hasDriveToken() {
  if (_tok && Date.now() < _tokExp) return true
  try {
    const t = localStorage.getItem('_drv_tok')
    const e = Number(localStorage.getItem('_drv_exp') || 0)
    if (t && Date.now() < e) { _tok = t; _tokExp = e; return true }
  } catch {}
  return false
}

/**
 * Gets a valid access token. If expired, re-authenticates via signInWithPopup.
 * Only call from user-initiated actions — popups may be blocked by browser
 * if not triggered by a user gesture. Background polls should call hasDriveToken() first.
 */
async function getToken() {
  if (hasDriveToken()) return _tok
  // Token expired — re-authenticate (works when called from user gesture chain)
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const cred   = GoogleAuthProvider.credentialFromResult(result)
    setDriveToken(cred.accessToken)
    return cred.accessToken
  } catch (err) {
    const e    = new Error('セッションが切れました。ページを再読み込みしてください。')
    e.code     = 'reauth-required'
    throw e
  }
}

// ─── HTTP ─────────────────────────────────────────────────────────────────────

async function api(method, path, { body, ct, upload, text: wantText, _retry } = {}) {
  const token  = await getToken()
  const base   = upload ? UPLOAD : DRIVE
  const headers = { Authorization: `Bearer ${token}` }
  if (ct) headers['Content-Type'] = ct

  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body } : {}),
  })

  // Expired token mid-session → clear it and retry once
  if (res.status === 401 && !_retry) {
    _tok = null
    return api(method, path, { body, ct, upload, text: wantText, _retry: true })
  }

  if (res.status === 204) return null  // DELETE success — no body

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const e   = new Error(err?.error?.message || `HTTP ${res.status}`)
    e.code    = (err?.error?.status || 'UNKNOWN').toLowerCase().replace(/_/g, '-')
    throw e
  }

  return wantText ? res.text() : res.json()
}

/** Convenience: JSON body → JSON response */
function jApi(method, path, body) {
  return api(method, path, {
    body : body !== undefined ? JSON.stringify(body) : undefined,
    ct   : body !== undefined ? 'application/json'  : undefined,
  })
}

/**
 * Multipart upload: metadata + file content in a single request.
 * Both parts are application/json (metadata object + worksheet JSON).
 */
function mpApi(metadata, content) {
  const body = [
    `--${BOUNDARY}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(metadata)}`,
    `\r\n--${BOUNDARY}\r\nContent-Type: application/json\r\n\r\n${content}`,
    `\r\n--${BOUNDARY}--`,
  ].join('')
  return api('POST', '/files?uploadType=multipart', {
    body,
    ct    : `multipart/related; boundary=${BOUNDARY}`,
    upload: true,
  })
}

// ─── App root folder ──────────────────────────────────────────────────────────

let _rootId = null

async function ensureRoot() {
  if (_rootId) return _rootId
  try {
    const c = localStorage.getItem('_drv_root')
    if (c) { _rootId = c; return c }
  } catch {}

  const q = enc(`name='${APP_FOLDER}' and mimeType='application/vnd.google-apps.folder' and trashed=false`)
  const r = await jApi('GET', `/files?q=${q}&fields=files(id)&spaces=drive`)
  if (r?.files?.length) {
    _rootId = r.files[0].id
  } else {
    const f = await jApi('POST', '/files', {
      name       : APP_FOLDER,
      mimeType   : 'application/vnd.google-apps.folder',
      appProperties: { appRoot: 'true' },
    })
    _rootId = f.id
  }
  try { localStorage.setItem('_drv_root', _rootId) } catch {}
  return _rootId
}

function enc(s) { return encodeURIComponent(s) }

/** Convert app folderId ('root' or Drive ID) → actual Drive folder ID. */
async function toDriveId(folderId) {
  return (!folderId || folderId === 'root') ? await ensureRoot() : folderId
}

/**
 * Build a createdAt object compatible with the rest of the UI:
 * - `.seconds` — used for sorting
 * - `.toDate()` — called in WorksheetCard / WorksheetViewer for display
 */
function makeCreatedAt(createdTime) {
  const ms = new Date(createdTime || Date.now()).getTime()
  return { seconds: Math.floor(ms / 1000), toDate: () => new Date(ms) }
}

// ─── Content cache (avoids re-fetching worksheet JSON on every poll) ──────────

const _cache = new Map()   // fileId → { data, at }

async function fetchContent(fileId) {
  const hit = _cache.get(fileId)
  if (hit && Date.now() - hit.at < 5 * 60_000) return hit.data   // 5-min TTL
  const text = await api('GET', `/files/${fileId}?alt=media`, { text: true })
  const data = JSON.parse(text)
  _cache.set(fileId, { data, at: Date.now() })
  return data
}

// ─── Public API (same shape as the old firestoreService.js) ───────────────────

export async function testFirestoreConnection(_uid) {
  if (!hasDriveToken()) {
    // No token yet — skip the test, don't trigger a popup in the background
    return { ok: true }
  }
  try {
    await ensureRoot()
    return { ok: true }
  } catch (err) {
    console.error('[Drive] ❌ Connection test failed', err)
    return { ok: false, code: err.code || 'unknown', message: err.message }
  }
}

// ─── Gemini API key ───────────────────────────────────────────────────────────
// Stored as a small JSON file inside the app root folder.

async function findKeyFileId() {
  const rootId = await ensureRoot()
  const q = enc(`name='_gemini_key.json' and '${rootId}' in parents and trashed=false`)
  const r = await jApi('GET', `/files?q=${q}&fields=files(id)`)
  return r?.files?.[0]?.id || null
}

export async function saveGeminiApiKey(_uid, apiKey) {
  const content  = JSON.stringify({ apiKey })
  const existing = await findKeyFileId()
  if (existing) {
    // Update existing file content
    await api('PATCH', `/files/${existing}?uploadType=media`, {
      body  : content,
      ct    : 'application/json',
      upload: true,
    })
  } else {
    const rootId = await ensureRoot()
    await mpApi(
      { name: '_gemini_key.json', parents: [rootId], appProperties: { appType: 'config' } },
      content,
    )
  }
}

export async function getGeminiApiKey(_uid) {
  const id = await findKeyFileId()
  if (!id) return null
  try {
    const text = await api('GET', `/files/${id}?alt=media`, { text: true })
    return JSON.parse(text).apiKey
  } catch { return null }
}

// ─── Folders ──────────────────────────────────────────────────────────────────

export async function createFolder(_uid, parentId, name) {
  const pid          = (!parentId || parentId === 'undefined') ? 'root' : parentId
  const parentDriveId = await toDriveId(pid)
  const f = await jApi('POST', '/files', {
    name,
    mimeType    : 'application/vnd.google-apps.folder',
    parents     : [parentDriveId],
    appProperties: { appType: 'folder', parentId: pid },
  })
  return f.id
}

export async function getFolders(_uid, parentId = 'root') {
  const parentDriveId = await toDriveId(parentId)
  const q = enc(
    `'${parentDriveId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false and appProperties has {key='appType' and value='folder'}`
  )
  const r = await jApi('GET', `/files?q=${q}&fields=files(id,name,appProperties,createdTime)&orderBy=createdTime`)
  return (r?.files || []).map(f => ({
    id       : f.id,
    name     : f.name,
    parentId : f.appProperties?.parentId || 'root',
    createdAt: makeCreatedAt(f.createdTime),
  }))
}

export async function getFolder(_uid, folderId) {
  if (folderId === 'root') return { id: 'root', name: 'マイドライブ', parentId: null }
  const f = await jApi('GET', `/files/${folderId}?fields=id,name,appProperties,createdTime`)
  return {
    id       : f.id,
    name     : f.name,
    parentId : f.appProperties?.parentId || 'root',
    createdAt: makeCreatedAt(f.createdTime),
  }
}

export async function renameFolder(_uid, folderId, name) {
  await jApi('PATCH', `/files/${folderId}`, { name })
}

export async function deleteFolder(_uid, folderId) {
  // Must delete contents before deleting the folder itself
  const [worksheets, subFolders] = await Promise.all([
    getWorksheets(_uid, folderId),
    getFolders(_uid, folderId),
  ])
  await Promise.all([
    ...worksheets.map(w  => deleteWorksheet(_uid, w.id)),
    ...subFolders.map(sf => deleteFolder(_uid, sf.id)),
  ])
  await jApi('DELETE', `/files/${folderId}`)
}

// ─── Worksheets ───────────────────────────────────────────────────────────────
//
// Worksheet name lives in the Drive FILE NAME (no byte limits apply there).
// appProperties only holds small values (≤ 124 bytes each):
//   appType  → 'worksheet'
//   folderId → the app folderId ('root' or Drive folder ID)
//   origType → 'pdf' | 'docx'
//   origName → original filename, capped at 100 chars (≤ 100 bytes for ASCII)

/** Build a metadata-only worksheet object (no worksheetData). */
function wsFromMeta(f) {
  return {
    id              : f.id,
    name            : f.name.replace(/\.json$/, ''),   // name stored in Drive file name
    folderId        : f.appProperties?.folderId || 'root',
    originalFileName: f.appProperties?.origName || '',
    originalFileType: f.appProperties?.origType || '',
    createdAt       : makeCreatedAt(f.createdTime),
    // worksheetData is NOT included — load lazily via getWorksheet()
  }
}

export async function saveWorksheet(_uid, folderId, originalFile, worksheetData) {
  const fid          = (!folderId || folderId === 'undefined') ? 'root' : folderId
  const parentDriveId = await toDriveId(fid)
  const wsName       = worksheetData.title || originalFile.name

  const f = await mpApi(
    {
      name    : `${wsName}.json`,
      parents : [parentDriveId],
      appProperties: {
        appType : 'worksheet',
        folderId: fid,
        origName: originalFile.name.slice(0, 100),   // stay within 124-byte limit
        origType: originalFile.name.split('.').pop().toLowerCase(),
      },
    },
    JSON.stringify(worksheetData),
  )

  // Pre-warm cache so the viewer opens instantly right after upload
  _cache.set(f.id, { data: worksheetData, at: Date.now() })
  return f.id
}

export async function getWorksheets(_uid, folderId = 'root') {
  const parentDriveId = await toDriveId(folderId)
  const q = enc(
    `'${parentDriveId}' in parents and mimeType='application/json' and trashed=false and appProperties has {key='appType' and value='worksheet'}`
  )
  const r = await jApi('GET', `/files?q=${q}&fields=files(id,name,appProperties,createdTime)&orderBy=createdTime desc`)
  return (r?.files || []).map(wsFromMeta)
}

/** Fetch full worksheet including worksheetData (reads file content from Drive). */
export async function getWorksheet(_uid, worksheetId) {
  const [meta, data] = await Promise.all([
    jApi('GET', `/files/${worksheetId}?fields=id,name,appProperties,createdTime`),
    fetchContent(worksheetId),
  ])
  return { ...wsFromMeta(meta), worksheetData: data }
}

export async function deleteWorksheet(_uid, worksheetId) {
  _cache.delete(worksheetId)
  await jApi('DELETE', `/files/${worksheetId}`)
}

export async function moveWorksheet(_uid, worksheetId, newFolderId) {
  const fid          = newFolderId || 'root'
  const newDriveId   = await toDriveId(fid)
  const meta         = await jApi('GET', `/files/${worksheetId}?fields=parents`)
  const oldParents   = (meta?.parents || []).join(',')
  await api(
    'PATCH',
    `/files/${worksheetId}?addParents=${newDriveId}&removeParents=${oldParents}`,
    { body: JSON.stringify({ appProperties: { folderId: fid } }), ct: 'application/json' },
  )
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

export async function buildBreadcrumb(_uid, folderId) {
  const path = [{ id: 'root', name: 'マイドライブ' }]
  if (!folderId || folderId === 'root') return path
  try {
    const visited = new Set()
    let   current = folderId
    while (current && current !== 'root' && !visited.has(current)) {
      visited.add(current)
      const folder = await getFolder(_uid, current)
      if (!folder) break
      path.splice(1, 0, folder)
      current = folder.parentId
    }
  } catch (err) {
    console.error('[Drive] buildBreadcrumb error', err)
  }
  return path
}
