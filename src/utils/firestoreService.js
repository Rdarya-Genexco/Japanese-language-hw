/**
 * Data layer — Firestore via REST API (bypasses SDK WebChannel/gRPC).
 *
 * Structure:
 *   users/{uid}/folders/{id}      — folder docs
 *   users/{uid}/worksheets/{id}   — worksheet docs (content stored as JSON string)
 *   users/{uid}/config/settings   — per-user config (Gemini API key etc.)
 */
import {
  restAdd, restGet, restSet, restUpdate, restDelete, restQuery, restList,
} from './firestoreREST'

// ── Connectivity test ──────────────────────────────────────────────────────────

export async function testFirestoreConnection(uid) {
  try {
    await restGet(`users/${uid}/config`, 'settings')
    return { ok: true }
  } catch (err) {
    // "Document not found" is fine — DB exists, doc just hasn't been created yet
    const isDocNotFound = err.code === 'not-found' &&
      !err.message?.toLowerCase().includes('database') &&
      !err.message?.toLowerCase().includes('does not exist')
    if (isDocNotFound) return { ok: true }

    // "Database does not exist" needs special code so the UI can show setup steps
    if (err.message?.toLowerCase().includes('does not exist') ||
        err.message?.toLowerCase().includes('database')) {
      const e = new Error(err.message)
      e.code = 'db-not-created'
      console.error('[Firestore] database not created', err)
      return { ok: false, code: 'db-not-created', message: err.message }
    }

    console.error('[Firestore] connection test failed', err)
    return { ok: false, code: err.code || 'unknown', message: err.message }
  }
}

// ── Gemini API key ─────────────────────────────────────────────────────────────

export async function saveGeminiApiKey(uid, apiKey) {
  await restSet(`users/${uid}/config`, 'settings', { geminiApiKey: apiKey })
}

export async function getGeminiApiKey(uid) {
  const doc = await restGet(`users/${uid}/config`, 'settings')
  return doc?.geminiApiKey || null
}

// ── Folders ────────────────────────────────────────────────────────────────────

export async function createFolder(uid, parentId, name) {
  const pid = (!parentId || parentId === 'undefined') ? 'root' : parentId
  return restAdd(`users/${uid}/folders`, { name, parentId: pid, createdAt: new Date() })
}

export async function getFolders(uid, parentId = 'root') {
  const pid = (!parentId || parentId === 'undefined') ? 'root' : parentId
  const docs = await restQuery(`users/${uid}/folders`, 'parentId', pid)
  return docs.map(d => ({ ...d, createdAt: makeCreatedAt(d.createdAt) }))
}

/** Get ALL folders for a user (flat list, any depth) — used for Move To picker. */
export async function getAllFolders(uid) {
  const docs = await restList(`users/${uid}/folders`)
  return docs.map(d => ({ ...d, createdAt: makeCreatedAt(d.createdAt) }))
}

export async function getFolder(uid, folderId) {
  if (folderId === 'root') return { id: 'root', name: 'マイドライブ', parentId: null }
  const doc = await restGet(`users/${uid}/folders`, folderId)
  if (!doc) return null
  return { ...doc, createdAt: makeCreatedAt(doc.createdAt) }
}

export async function renameFolder(uid, folderId, name) {
  await restUpdate(`users/${uid}/folders`, folderId, { name })
}

export async function deleteFolder(uid, folderId) {
  const [worksheets, subFolders] = await Promise.all([
    getWorksheets(uid, folderId),
    getFolders(uid, folderId),
  ])
  await Promise.all([
    ...worksheets.map(w  => deleteWorksheet(uid, w.id)),
    ...subFolders.map(sf => deleteFolder(uid, sf.id)),
  ])
  await restDelete(`users/${uid}/folders`, folderId)
}

// ── Worksheets ─────────────────────────────────────────────────────────────────

/**
 * Save a worksheet.
 * worksheetPayload can be:
 *   - a string  → new HTML-based worksheet (Gemini-generated HTML)
 *   - an object → legacy JSON-based worksheet
 */
export async function saveWorksheet(uid, folderId, originalFile, worksheetPayload) {
  const fid = (!folderId || folderId === 'undefined') ? 'root' : folderId
  const isHtml = typeof worksheetPayload === 'string'

  // Derive a display name from the HTML <title> tag or file name
  let name = originalFile.name
  if (isHtml) {
    const titleMatch = worksheetPayload.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch) name = titleMatch[1].trim()
  } else if (worksheetPayload?.title) {
    name = worksheetPayload.title
  }

  return restAdd(`users/${uid}/worksheets`, {
    name            : name.slice(0, 200),
    folderId        : fid,
    originalFileName: originalFile.name.slice(0, 200),
    originalFileType: originalFile.name.split('.').pop().toLowerCase(),
    // New: store HTML directly; legacy: store JSON string
    ...(isHtml
      ? { worksheetHtml: worksheetPayload }
      : { worksheetData: JSON.stringify(worksheetPayload) }
    ),
    createdAt : new Date(),
  })
}

export async function getWorksheets(uid, folderId = 'root') {
  const fid = (!folderId || folderId === 'undefined') ? 'root' : folderId
  const docs = await restQuery(`users/${uid}/worksheets`, 'folderId', fid)
  return docs
    .map(d => ({
      id              : d.id,
      name            : d.name,
      folderId        : d.folderId || 'root',
      originalFileName: d.originalFileName || '',
      originalFileType: d.originalFileType || '',
      createdAt       : makeCreatedAt(d.createdAt),
    }))
    .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
}

export async function getWorksheet(uid, worksheetId) {
  const doc = await restGet(`users/${uid}/worksheets`, worksheetId)
  if (!doc) throw new Error('Worksheet not found')

  // New HTML-based worksheets
  if (doc.worksheetHtml) {
    return {
      id              : doc.id,
      name            : doc.name,
      folderId        : doc.folderId || 'root',
      originalFileName: doc.originalFileName || '',
      originalFileType: doc.originalFileType || '',
      createdAt       : makeCreatedAt(doc.createdAt),
      worksheetHtml   : doc.worksheetHtml,   // string: rendered HTML
      worksheetData   : null,
    }
  }

  // Legacy JSON-based worksheets
  let wsData = doc.worksheetData
  if (typeof wsData === 'string') {
    try { wsData = JSON.parse(wsData) } catch { wsData = {} }
  }
  return {
    id              : doc.id,
    name            : doc.name,
    folderId        : doc.folderId || 'root',
    originalFileName: doc.originalFileName || '',
    originalFileType: doc.originalFileType || '',
    createdAt       : makeCreatedAt(doc.createdAt),
    worksheetHtml   : null,
    worksheetData   : wsData,
  }
}

export async function deleteWorksheet(uid, worksheetId) {
  await restDelete(`users/${uid}/worksheets`, worksheetId)
}

export async function moveWorksheet(uid, worksheetId, newFolderId) {
  await restUpdate(`users/${uid}/worksheets`, worksheetId, { folderId: newFolderId || 'root' })
}

// ── Breadcrumb ─────────────────────────────────────────────────────────────────

export async function buildBreadcrumb(uid, folderId) {
  const path = [{ id: 'root', name: 'マイドライブ' }]
  if (!folderId || folderId === 'root') return path
  try {
    const visited = new Set()
    let current = folderId
    while (current && current !== 'root' && !visited.has(current)) {
      visited.add(current)
      const folder = await getFolder(uid, current)
      if (!folder) break
      path.splice(1, 0, folder)
      current = folder.parentId
    }
  } catch (err) {
    console.error('[Firestore] buildBreadcrumb error', err)
  }
  return path
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeCreatedAt(val) {
  if (!val) {
    const ms = Date.now()
    return { seconds: Math.floor(ms / 1000), toDate: () => new Date(ms) }
  }
  if (typeof val === 'object' && 'seconds' in val) {
    const ms = val.seconds * 1000
    return { seconds: val.seconds, toDate: () => new Date(ms) }
  }
  const ms = new Date(val).getTime() || Date.now()
  return { seconds: Math.floor(ms / 1000), toDate: () => new Date(ms) }
}
