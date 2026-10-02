/**
 * Data layer — Firestore via REST API (bypasses SDK WebChannel/gRPC).
 *
 * Structure:
 *   users/{uid}/folders/{id}      — folder docs
 *   users/{uid}/worksheets/{id}   — worksheet docs (content stored as JSON string)
 *   users/{uid}/config/settings   — per-user config (Gemini API key etc.)
 */
import {
  restAdd, restGet, restSet, restUpdate, restDelete, restQuery, restList, restGetPublic,
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

// ── User profile ───────────────────────────────────────────────────────────────

export async function getUserData(uid) {
  try {
    return await restGet('users', uid)
  } catch {
    return null
  }
}

export async function saveUserData(uid, data) {
  await restUpdate('users', uid, data)
}

export async function getUserRole(uid) {
  const doc = await getUserData(uid)
  return doc?.role || null
}

export async function saveUserRole(uid, role) {
  await restUpdate('users', uid, { role })
}

// ── Shared worksheets ──────────────────────────────────────────────────────────

export async function createShareToken(uid, worksheetId, worksheetHtml, name) {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map(b => b.toString(36).padStart(2, '0')).join('').slice(0, 16)
  await restSet('sharedWorksheets', token, {
    teacherUid: uid,
    worksheetId,
    worksheetHtml,
    name,
    createdAt: new Date(),
  })
  return token
}

export async function getSharedWorksheet(token) {
  return restGetPublic('sharedWorksheets', token)
}

// ── Classrooms ─────────────────────────────────────────────────────────────────

export async function createClassroom(uid) {
  const code = Array.from(crypto.getRandomValues(new Uint8Array(3)))
    .map(b => b.toString(36).padStart(2, '0')).join('').toUpperCase().slice(0, 6)
  await Promise.all([
    restSet('classrooms', code, { teacherUid: uid, code, createdAt: new Date() }),
    restUpdate('users', uid, { classroomCode: code }),
  ])
  return code
}

export async function getClassroom(code) {
  return restGet('classrooms', code.toUpperCase())
}

/** Deletes subcollections first: rules check the class doc's teacherUid, and Firestore doesn't cascade. */
export async function deleteClassroom(code) {
  const base = `classrooms/${code.toUpperCase()}`
  const [assignments, members, submissions] = await Promise.all([
    restList(`${base}/assignments`),
    restList(`${base}/members`),
    restList(`${base}/submissions`),
  ])
  const assignmentSubs = await Promise.all(
    assignments.map(a => restList(`${base}/assignments/${a.id}/submissions`))
  )
  await Promise.all([
    ...assignments.flatMap((a, i) =>
      assignmentSubs[i].map(s => restDelete(`${base}/assignments/${a.id}/submissions`, s.id))),
    ...members.map(m => restDelete(`${base}/members`, m.id)),
    ...submissions.map(s => restDelete(`${base}/submissions`, s.id)),
  ])
  await Promise.all(assignments.map(a => restDelete(`${base}/assignments`, a.id)))
  await restDelete('classrooms', code.toUpperCase())
}

export async function getTeacherClassrooms(uid) {
  try {
    const docs = await restQuery('classrooms', 'teacherUid', uid)
    return docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  } catch {
    return []
  }
}

export async function upsertClassroomMember(code, user, { joined = false } = {}) {
  return restUpdate(`classrooms/${code.toUpperCase()}/members`, user.uid, {
    name: user.displayName || '',
    email: user.email || '',
    photoURL: user.photoURL || '',
    ...(joined ? { joinedAt: new Date() } : {}),
  })
}

export async function leaveClassroom(code, uid) {
  return restDelete(`classrooms/${code.toUpperCase()}/members`, uid)
}

export async function getClassroomMember(code, uid) {
  return restGet(`classrooms/${code.toUpperCase()}/members`, uid)
}

/** Marks rather than deletes, so the student can't silently rejoin with the same code. */
export async function removeClassroomMember(code, uid) {
  return restUpdate(`classrooms/${code.toUpperCase()}/members`, uid, { removed: true, removedAt: new Date() })
}

export async function getClassroomMembers(code) {
  const docs = (await restList(`classrooms/${code.toUpperCase()}/members`)).filter(m => !m.removed)
  return docs.sort((a, b) => (a.name || a.email || '').localeCompare(b.name || b.email || ''))
}

export async function submitToClassroom(code, studentUid, studentName, worksheetName, worksheetHtml) {
  return restAdd(`classrooms/${code.toUpperCase()}/submissions`, {
    studentUid,
    studentName: studentName || '',
    worksheetName: worksheetName || '',
    worksheetHtml,
    submittedAt: new Date(),
  })
}

export async function getClassroomSubmissions(code) {
  try {
    return await restList(`classrooms/${code.toUpperCase()}/submissions`)
  } catch {
    return []
  }
}

// ── Assignments ─────────────────────────────────────────────────────────────────

export async function createAssignment(code, teacherUid, title, description, dueDate, attachedWorksheet = null) {
  return restAdd(`classrooms/${code.toUpperCase()}/assignments`, {
    teacherUid,
    title,
    description: description || '',
    dueDate: dueDate || null,
    createdAt: new Date(),
    ...(attachedWorksheet ? {
      attachedWorksheetName: attachedWorksheet.name,
      attachedWorksheetHtml: attachedWorksheet.worksheetHtml || '',
    } : {}),
  })
}

export async function getAllWorksheets(uid) {
  try {
    const docs = await restList(`users/${uid}/worksheets`)
    return docs
      .map(d => ({ id: d.id, name: d.name || d.originalFileName || 'Untitled' }))
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    return []
  }
}

export async function getAssignments(code) {
  try {
    return await restList(`classrooms/${code.toUpperCase()}/assignments`)
  } catch {
    return []
  }
}

export async function getAssignmentSubmissions(code, assignmentId) {
  try {
    return await restList(`classrooms/${code.toUpperCase()}/assignments/${assignmentId}/submissions`)
  } catch {
    return []
  }
}

export async function submitToAssignment(code, assignmentId, studentUid, studentName, worksheetName, worksheetHtml) {
  return restAdd(`classrooms/${code.toUpperCase()}/assignments/${assignmentId}/submissions`, {
    studentUid,
    studentName: studentName || '',
    worksheetName,
    worksheetHtml,
    submittedAt: new Date(),
  })
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
export async function saveWorksheet(uid, folderId, originalFile, worksheetPayload, imageUri = null) {
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
    // Store original image separately so the viewer can inject it client-side.
    // This keeps worksheetHtml lean and avoids large data URIs inside HTML strings.
    ...(imageUri ? { originalImageUri: imageUri } : {}),
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
      worksheetHtml   : doc.worksheetHtml,           // string: rendered HTML
      originalImageUri: doc.originalImageUri || null, // data URI for embedded photo
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
