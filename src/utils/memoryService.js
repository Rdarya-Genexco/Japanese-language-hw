/**
 * In-memory storage service — same API as firestoreService.js.
 * Data lives only for the current page session; nothing is persisted.
 * Used automatically when the signed-in user is anonymous (test mode).
 */

let _nextId = 1
function uid() { return `mem_${_nextId++}` }

function now() {
  const ms = Date.now()
  return { seconds: Math.floor(ms / 1000), toDate: () => new Date(ms) }
}

// ── In-memory stores (cleared on page reload) ─────────────────────────────────

const _folders    = new Map() // id → folder doc
const _worksheets = new Map() // id → worksheet doc

// ── Connection test ────────────────────────────────────────────────────────────

export async function testFirestoreConnection() {
  return { ok: true }
}

// ── Gemini API key ─────────────────────────────────────────────────────────────

export async function saveGeminiApiKey() { /* no-op in test mode */ }
export async function getGeminiApiKey()  { return null }

// ── Folders ────────────────────────────────────────────────────────────────────

export async function createFolder(_uid, parentId, name) {
  const id = uid()
  const pid = (!parentId || parentId === 'undefined') ? 'root' : parentId
  _folders.set(id, { id, name, parentId: pid, createdAt: now() })
  return id
}

export async function getFolders(_uid, parentId = 'root') {
  const pid = (!parentId || parentId === 'undefined') ? 'root' : parentId
  return [..._folders.values()].filter(f => f.parentId === pid)
}

export async function getAllFolders() {
  return [..._folders.values()]
}

export async function getFolder(_uid, folderId) {
  if (folderId === 'root') return { id: 'root', name: 'マイドライブ', parentId: null }
  return _folders.get(folderId) || null
}

export async function renameFolder(_uid, folderId, name) {
  const f = _folders.get(folderId)
  if (f) _folders.set(folderId, { ...f, name })
}

export async function deleteFolder(_uid, folderId) {
  // Recursively delete contents
  const children = await getFolders(_uid, folderId)
  const sheets   = await getWorksheets(_uid, folderId)
  await Promise.all([
    ...children.map(c  => deleteFolder(_uid, c.id)),
    ...sheets.map(w    => deleteWorksheet(_uid, w.id)),
  ])
  _folders.delete(folderId)
}

// ── Worksheets ─────────────────────────────────────────────────────────────────

export async function saveWorksheet(_uid, folderId, originalFile, payload, imageUri = null) {
  const fid    = (!folderId || folderId === 'undefined') ? 'root' : folderId
  const isHtml = typeof payload === 'string'
  let name = originalFile.name
  if (isHtml) {
    const m = payload.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (m) name = m[1].trim()
  } else if (payload?.title) {
    name = payload.title
  }
  const id = uid()
  _worksheets.set(id, {
    id,
    name            : name.slice(0, 200),
    folderId        : fid,
    originalFileName: originalFile.name.slice(0, 200),
    originalFileType: originalFile.name.split('.').pop().toLowerCase(),
    ...(isHtml
      ? { worksheetHtml: payload }
      : { worksheetData: typeof payload === 'string' ? payload : JSON.stringify(payload) }
    ),
    ...(imageUri ? { originalImageUri: imageUri } : {}),
    createdAt: now(),
  })
  return id
}

export async function getWorksheets(_uid, folderId = 'root') {
  const fid = (!folderId || folderId === 'undefined') ? 'root' : folderId
  return [..._worksheets.values()]
    .filter(w => (w.folderId || 'root') === fid)
    .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
    .map(w => ({
      id              : w.id,
      name            : w.name,
      folderId        : w.folderId || 'root',
      originalFileName: w.originalFileName || '',
      originalFileType: w.originalFileType || '',
      createdAt       : w.createdAt,
    }))
}

export async function getWorksheet(_uid, worksheetId) {
  const doc = _worksheets.get(worksheetId)
  if (!doc) throw new Error('Worksheet not found')
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
    createdAt       : doc.createdAt,
    worksheetHtml   : doc.worksheetHtml || null,
    originalImageUri: doc.originalImageUri || null,
    worksheetData   : wsData || null,
  }
}

export async function deleteWorksheet(_uid, worksheetId) {
  _worksheets.delete(worksheetId)
}

export async function moveWorksheet(_uid, worksheetId, newFolderId) {
  const w = _worksheets.get(worksheetId)
  if (w) _worksheets.set(worksheetId, { ...w, folderId: newFolderId || 'root' })
}

// ── Breadcrumb ─────────────────────────────────────────────────────────────────

export async function buildBreadcrumb(_uid, folderId) {
  const path = [{ id: 'root', name: 'マイドライブ' }]
  if (!folderId || folderId === 'root') return path
  const visited = new Set()
  let current = folderId
  while (current && current !== 'root' && !visited.has(current)) {
    visited.add(current)
    const folder = await getFolder(_uid, current)
    if (!folder) break
    path.splice(1, 0, folder)
    current = folder.parentId
  }
  return path
}
