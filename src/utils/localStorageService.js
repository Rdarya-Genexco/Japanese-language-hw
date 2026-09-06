/**
 * localStorage-based data service — same API as firestoreService.js.
 * No login, no server. Data lives in the browser.
 *
 * Storage keys:
 *   jw_folders      → JSON array of folder objects
 *   jw_worksheets   → JSON array of worksheet objects (worksheetData stored inline as JSON string)
 *   jw_gemini_key   → Gemini API key string
 */

const FOLDERS_KEY    = 'jw_folders'
const WORKSHEETS_KEY = 'jw_worksheets'

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function load(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      throw new Error('ストレージ容量が不足しています。古いワークシートを削除してください。')
    }
    throw e
  }
}

function makeCreatedAt(iso) {
  const ms = iso ? new Date(iso).getTime() : Date.now()
  return { seconds: Math.floor(ms / 1000), toDate: () => new Date(ms) }
}

// ── Connectivity test (always ok for localStorage) ────────────────────────────

export async function testFirestoreConnection(_uid) {
  return { ok: true }
}

// ── Gemini API key ─────────────────────────────────────────────────────────────

export async function saveGeminiApiKey(_uid, apiKey) {
  localStorage.setItem('jw_gemini_key', apiKey)
}

export async function getGeminiApiKey(_uid) {
  return localStorage.getItem('jw_gemini_key') || null
}

// ── Folders ────────────────────────────────────────────────────────────────────

export async function createFolder(_uid, parentId, name) {
  const pid = (!parentId || parentId === 'undefined') ? 'root' : parentId
  const folders = load(FOLDERS_KEY)
  const folder = { id: genId(), name, parentId: pid, createdAt: new Date().toISOString() }
  folders.push(folder)
  save(FOLDERS_KEY, folders)
  return folder.id
}

export async function getFolders(_uid, parentId = 'root') {
  const pid = (!parentId || parentId === 'undefined') ? 'root' : parentId
  const folders = load(FOLDERS_KEY)
  return folders
    .filter(f => f.parentId === pid)
    .map(f => ({ ...f, createdAt: makeCreatedAt(f.createdAt) }))
}

export async function getFolder(_uid, folderId) {
  if (folderId === 'root') return { id: 'root', name: 'マイドライブ', parentId: null }
  const folders = load(FOLDERS_KEY)
  const f = folders.find(f => f.id === folderId)
  if (!f) return null
  return { ...f, createdAt: makeCreatedAt(f.createdAt) }
}

export async function renameFolder(_uid, folderId, name) {
  const folders = load(FOLDERS_KEY)
  const idx = folders.findIndex(f => f.id === folderId)
  if (idx !== -1) { folders[idx].name = name; save(FOLDERS_KEY, folders) }
}

export async function deleteFolder(_uid, folderId) {
  const [worksheets, subFolders] = await Promise.all([
    getWorksheets(_uid, folderId),
    getFolders(_uid, folderId),
  ])
  await Promise.all([
    ...worksheets.map(w  => deleteWorksheet(_uid, w.id)),
    ...subFolders.map(sf => deleteFolder(_uid, sf.id)),
  ])
  const folders = load(FOLDERS_KEY)
  save(FOLDERS_KEY, folders.filter(f => f.id !== folderId))
}

// ── Worksheets ─────────────────────────────────────────────────────────────────

export async function saveWorksheet(_uid, folderId, originalFile, worksheetData) {
  const fid = (!folderId || folderId === 'undefined') ? 'root' : folderId
  const worksheets = load(WORKSHEETS_KEY)
  const ws = {
    id              : genId(),
    name            : worksheetData.title || originalFile.name,
    folderId        : fid,
    originalFileName: originalFile.name.slice(0, 200),
    originalFileType: originalFile.name.split('.').pop().toLowerCase(),
    worksheetData   : JSON.stringify(worksheetData),
    createdAt       : new Date().toISOString(),
  }
  worksheets.push(ws)
  save(WORKSHEETS_KEY, worksheets)
  return ws.id
}

export async function getWorksheets(_uid, folderId = 'root') {
  const fid = (!folderId || folderId === 'undefined') ? 'root' : folderId
  const worksheets = load(WORKSHEETS_KEY)
  return worksheets
    .filter(w => w.folderId === fid)
    .map(w => ({
      id              : w.id,
      name            : w.name,
      folderId        : w.folderId,
      originalFileName: w.originalFileName || '',
      originalFileType: w.originalFileType || '',
      createdAt       : makeCreatedAt(w.createdAt),
    }))
    .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
}

export async function getWorksheet(_uid, worksheetId) {
  const worksheets = load(WORKSHEETS_KEY)
  const w = worksheets.find(w => w.id === worksheetId)
  if (!w) throw new Error('Worksheet not found')
  let wsData = w.worksheetData
  if (typeof wsData === 'string') {
    try { wsData = JSON.parse(wsData) } catch { wsData = {} }
  }
  return {
    id              : w.id,
    name            : w.name,
    folderId        : w.folderId,
    originalFileName: w.originalFileName || '',
    originalFileType: w.originalFileType || '',
    createdAt       : makeCreatedAt(w.createdAt),
    worksheetData   : wsData,
  }
}

export async function deleteWorksheet(_uid, worksheetId) {
  const worksheets = load(WORKSHEETS_KEY)
  save(WORKSHEETS_KEY, worksheets.filter(w => w.id !== worksheetId))
}

export async function moveWorksheet(_uid, worksheetId, newFolderId) {
  const fid = newFolderId || 'root'
  const worksheets = load(WORKSHEETS_KEY)
  const idx = worksheets.findIndex(w => w.id === worksheetId)
  if (idx !== -1) { worksheets[idx].folderId = fid; save(WORKSHEETS_KEY, worksheets) }
}

// ── Breadcrumb ─────────────────────────────────────────────────────────────────

export async function buildBreadcrumb(_uid, folderId) {
  const path = [{ id: 'root', name: 'マイドライブ' }]
  if (!folderId || folderId === 'root') return path
  try {
    const visited = new Set()
    let current = folderId
    while (current && current !== 'root' && !visited.has(current)) {
      visited.add(current)
      const folder = await getFolder(_uid, current)
      if (!folder) break
      path.splice(1, 0, folder)
      current = folder.parentId
    }
  } catch (err) {
    console.error('[LocalStorage] buildBreadcrumb error', err)
  }
  return path
}
