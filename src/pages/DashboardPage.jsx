import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'
import { useRole } from '../contexts/RoleContext'
import {
  getFolders, getWorksheets, getWorksheet,
  createFolder, deleteFolder, deleteWorksheet,
  renameFolder, buildBreadcrumb, testFirestoreConnection, moveWorksheet, getAllFolders,
  getAssignments,
} from '../utils/storageService'
import { openPrintView, downloadAsDocx, downloadAsPdf, downloadAsPdfFromHtml, downloadAsDocxFromHtml } from '../utils/worksheetGenerator'
import Header from '../components/Header'
import Breadcrumb from '../components/Breadcrumb'
import FolderCard from '../components/FolderCard'
import WorksheetCard from '../components/WorksheetCard'
import UploadModal from '../components/UploadModal'
import NewFolderModal from '../components/NewFolderModal'
import WorksheetViewer from '../components/WorksheetViewer'
import MoveToModal from '../components/MoveToModal'
import EmptyState from '../components/EmptyState'
import { FolderPlus, Upload, RefreshCw, LayoutGrid, List, School, ClipboardList } from 'lucide-react'
import BottomNav from '../components/BottomNav'

export default function DashboardPage() {
  const { user }              = useAuth()
  const { t }                 = useLang()
  const { role, classroomCode } = useRole()
  const { folderId = 'root' } = useParams()
  const navigate              = useNavigate()

  const [folders,      setFolders]      = useState([])
  const [worksheets,   setWorksheets]   = useState([])
  const [breadcrumb,   setBreadcrumb]   = useState([{ id: 'root', name: t('drive') }])
  const [loading,      setLoading]      = useState(true)
  const [driveError,   setDriveError]   = useState(null)
  const [testing,      setTesting]      = useState(false)

  const [showUpload,    setShowUpload]    = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [viewWorksheet, setViewWorksheet] = useState(null)
  const [wsLoading,     setWsLoading]    = useState(false)
  const [isDragging,      setIsDragging]      = useState(false)
  const [dragOverFolderId, setDragOverFolderId] = useState(null)
  const [touchPos,         setTouchPos]         = useState(null)
  const [moveToWorksheet,  setMoveToWorksheet]  = useState(null) // {id, name}
  const [listView,         setListView]         = useState(false)
  const [assignments,      setAssignments]      = useState([])
  const streak = worksheets.length > 0 ? Math.min(worksheets.length, 7) : 0

  // ── Load folder contents ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const [f, w] = await Promise.all([
        getFolders(user.uid, folderId),
        getWorksheets(user.uid, folderId),
      ])
      setFolders(f)
      setWorksheets(w)
    } catch (err) {
      console.error('[Dashboard] load error', err)
      setDriveError({ code: err.code || 'unknown', message: err.message })
    } finally {
      setLoading(false)
    }
  }, [user.uid, folderId])

  useEffect(() => {
    setLoading(true)
    load()
    buildBreadcrumb(user.uid, folderId).then(bc => {
      setBreadcrumb([{ id: 'root', name: t('drive') }, ...bc.slice(1)])
    }).catch(() => {})
  }, [load, user.uid, folderId, t])

  // Load assignments for students who have a classroom code
  useEffect(() => {
    if (role !== 'student' || !classroomCode || folderId !== 'root') return
    getAssignments(classroomCode).then(list => {
      setAssignments(list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
    }).catch(() => {})
  }, [role, classroomCode, folderId])

  // ── Retry connectivity ────────────────────────────────────────────────────
  const handleRetryTest = async () => {
    setTesting(true)
    const result = await testFirestoreConnection(user.uid)
    setTesting(false)
    if (result.ok) { setDriveError(null); load() }
    else setDriveError({ code: result.code, message: result.message })
  }

  // ── View worksheet ────────────────────────────────────────────────────────
  const handleViewWorksheet = async (ws) => {
    if (wsLoading) return
    setWsLoading(true)
    try {
      const full = await getWorksheet(user.uid, ws.id)
      setViewWorksheet(full)
    } catch (err) {
      console.error('[Dashboard] getWorksheet error', err)
      alert(t('loadFailed'))
    } finally {
      setWsLoading(false)
    }
  }

  // ── Print / download ──────────────────────────────────────────────────────
  /** Replace [WORKSHEET_IMAGE] placeholder with the stored image URI, if present. */
  function hydrateHtml(html, imageUri) {
    if (!html || !html.includes('[WORKSHEET_IMAGE]')) return html
    if (imageUri) return html.replace(/\[WORKSHEET_IMAGE\]/g, imageUri)
    return html
      .replace(/<img\b[^>]*\[WORKSHEET_IMAGE\][^>]*>/gi, '')
      .replace(/\[WORKSHEET_IMAGE\]/g, '')
  }

  const handlePrint = async (ws) => {
    setWsLoading(true)
    try {
      const full = await getWorksheet(user.uid, ws.id)
      if (full.worksheetHtml) {
        const html = hydrateHtml(full.worksheetHtml, full.originalImageUri)
        const win = window.open('', '_blank')
        if (!win) { alert('Please allow popups for this site and try again.'); return }
        win.document.write(html)
        win.document.close()
        win.focus()
        setTimeout(() => win.print(), 800)
      } else {
        openPrintView(full.worksheetData)
      }
    } catch (err) { alert(t('loadFailed') + ': ' + err.message) }
    finally  { setWsLoading(false) }
  }

  const handleDocx = async (ws) => {
    setWsLoading(true)
    try {
      const full = await getWorksheet(user.uid, ws.id)
      if (full.worksheetHtml) {
        const html = hydrateHtml(full.worksheetHtml, full.originalImageUri)
        await downloadAsDocxFromHtml(html, (ws.name || 'worksheet').replace(/\.[^.]+$/, ''))
      } else {
        await downloadAsDocx(full.worksheetData)
      }
    } catch (err) { alert(t('loadFailed') + ': ' + err.message) }
    finally  { setWsLoading(false) }
  }

  const handlePdfDownload = async (ws) => {
    setWsLoading(true)
    try {
      const full = await getWorksheet(user.uid, ws.id)
      if (full.worksheetHtml) {
        const html = hydrateHtml(full.worksheetHtml, full.originalImageUri)
        await downloadAsPdfFromHtml(html, (ws.name || 'worksheet').replace(/\.[^.]+$/, ''))
      } else {
        await downloadAsPdf(full.worksheetData)
      }
    } catch (err) { alert(t('loadFailed') + ': ' + err.message) }
    finally  { setWsLoading(false) }
  }

  // ── Folder CRUD ───────────────────────────────────────────────────────────
  const handleCreateFolder = async (name) => {
    await createFolder(user.uid, folderId, name)
    load()
  }

  const handleDeleteFolder = (folder) => {
    // Defer off the click handler so window.confirm doesn't count against it
    // (Chrome Long Tasks API flags "click handler took Xms" otherwise)
    setTimeout(async () => {
      if (!window.confirm(`${t('confirmDeleteFolder')}\n「${folder.name}」`)) return
      await deleteFolder(user.uid, folder.id)
      load()
    }, 0)
  }

  const handleRenameFolder = (folder) => {
    setTimeout(async () => {
      const raw = window.prompt(`${t('folderName')}:`, folder.name)
      const name = raw?.trim()
      if (!name || name === folder.name) return
      await renameFolder(user.uid, folder.id, name)
      load()
    }, 0)
  }

  // ── Move worksheet (drag & drop) ─────────────────────────────────────────
  const handleMoveWorksheet = async (worksheetId, targetFolderId) => {
    if (!targetFolderId || targetFolderId === folderId) return
    try {
      await moveWorksheet(user.uid, worksheetId, targetFolderId)
      load()
    } catch (err) {
      console.error('[Dashboard] moveWorksheet error', err)
      alert('Failed to move worksheet: ' + err.message)
    }
  }

  // ── Touch drag helpers ────────────────────────────────────────────────────
  const handleTouchDragStart = (wsId, x, y) => {
    setIsDragging(true)
    setTouchPos({ x, y })
  }

  const handleTouchDragMove = (wsId, x, y) => {
    setTouchPos({ x, y })
    // Find the folder element under the touch point
    const el = document.elementFromPoint(x, y)
    const folderEl = el?.closest('[data-folder-id]')
    setDragOverFolderId(folderEl?.dataset.folderId || null)
  }

  const handleTouchDragEnd = (wsId, x, y) => {
    const el = document.elementFromPoint(x, y)
    const folderEl = el?.closest('[data-folder-id]')
    const targetFolderId = folderEl?.dataset.folderId || null
    setIsDragging(false)
    setDragOverFolderId(null)
    setTouchPos(null)
    if (targetFolderId) handleMoveWorksheet(wsId, targetFolderId)
  }

  // ── Worksheet CRUD ────────────────────────────────────────────────────────
  const handleDeleteWorksheet = (ws) => {
    setTimeout(async () => {
      if (!window.confirm(`${t('confirmDeleteWorksheet')}\n「${ws.name}」`)) return
      await deleteWorksheet(user.uid, ws.id)
      if (viewWorksheet?.id === ws.id) setViewWorksheet(null)
      load()
    }, 0)
  }

  const isEmpty = !loading && folders.length === 0 && worksheets.length === 0

  // Error help text (kept in English for technical content)
  const driveHelp = driveError ? buildDriveHelp(driveError.code) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col">
      <Header streak={streak} />
      <BottomNav onUpload={() => setShowUpload(true)} />

      <div className="max-w-6xl mx-auto w-full px-4 py-4 flex-1 with-bottom-nav">

        {/* Student motivational banner */}
        {role === 'student' && folderId === 'root' && !loading && (
          <div className="mb-4 space-y-3">
            {/* Main welcome banner */}
            <div className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 rounded-2xl p-4 relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
              <div className="absolute -bottom-2 right-12 w-12 h-12 bg-white/10 rounded-full" />
              <div className="flex items-center gap-4 relative">
                <span className="text-4xl flex-shrink-0 animate-bounce" style={{ animationDuration: '2s' }}>🎒</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-base">
                    {user?.displayName ? `Hey ${user.displayName.split(' ')[0]}! 👋` : 'Welcome back!'}
                  </p>
                  <p className="text-white/80 text-xs mt-0.5">
                    {worksheets.length === 0
                      ? '🌟 Upload your first worksheet to get started!'
                      : worksheets.length < 3
                      ? `You have ${worksheets.length} worksheet${worksheets.length !== 1 ? 's' : ''}. Keep going! 💪`
                      : `${worksheets.length} worksheets done! You're on a roll! 🚀`}
                  </p>
                </div>
                {streak > 0 && (
                  <div className="flex-shrink-0 bg-white/20 rounded-2xl px-3 py-2 text-center border border-white/30">
                    <p className="text-2xl font-black text-white leading-none">{streak}</p>
                    <p className="text-white/80 text-xs mt-0.5">🔥 streak</p>
                  </div>
                )}
              </div>
            </div>

            {/* Achievement badges */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { icon: '🌱', label: 'Started', done: worksheets.length >= 1 },
                { icon: '📚', label: '3 sheets', done: worksheets.length >= 3 },
                { icon: '⭐', label: '5 sheets', done: worksheets.length >= 5 },
                { icon: '🏆', label: '10 sheets', done: worksheets.length >= 10 },
              ].map(badge => (
                <div
                  key={badge.label}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border text-center transition-all ${
                    badge.done
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-40'
                  }`}
                >
                  <span className="text-xl leading-none">{badge.done ? badge.icon : '🔒'}</span>
                  <span className={`text-xs font-semibold ${badge.done ? 'text-amber-700 dark:text-amber-400' : 'text-slate-400'}`}>
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Assignments from teacher */}
            {assignments.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-blue-200 dark:border-blue-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardList size={15} className="text-blue-500" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Assignments</span>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full">
                    {assignments.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {assignments.slice(0, 3).map(a => (
                    <div key={a.id} className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2.5">
                      <span className="text-lg flex-shrink-0">📋</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{a.title}</p>
                        {a.dueDate && <p className="text-xs text-amber-600 dark:text-amber-400">Due: {a.dueDate}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Teacher stats row */}
        {role === 'teacher' && folderId === 'root' && !loading && (
          <div className="mb-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{worksheets.length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Worksheets</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
                <p className="text-2xl font-black text-violet-600 dark:text-violet-400">{folders.length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Folders</p>
              </div>
              <button
                onClick={() => navigate('/classes')}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center hover:border-cyan-300 dark:hover:border-cyan-600 transition-colors"
              >
                <p className="text-2xl">🏫</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Classes ↗</p>
              </button>
            </div>
            <button
              onClick={() => navigate('/classes')}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              <School size={15} /> Manage Classes &amp; Assignments
            </button>
          </div>
        )}

        {/* Breadcrumb + action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <Breadcrumb
            items={breadcrumb}
            isDragTarget={isDragging}
            onDropWorksheet={handleMoveWorksheet}
          />
          <div className="flex items-center gap-2">
            {role === 'teacher' && (
              <button
                onClick={() => setListView(v => !v)}
                className="btn-secondary text-sm"
                title={listView ? 'Grid view' : 'List view'}
              >
                {listView ? <LayoutGrid size={16} /> : <List size={16} />}
              </button>
            )}
            <button onClick={() => setShowNewFolder(true)} className="btn-secondary text-sm">
              <FolderPlus size={16} /> {t('newFolder')}
            </button>
            <button onClick={() => setShowUpload(true)} className="btn-primary text-sm">
              <Upload size={16} /> {t('upload')}
            </button>
          </div>
        </div>

        {/* Error banner */}
        {driveError && driveHelp && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5 mb-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">{driveHelp.title}</h3>
                <ol className="text-xs text-red-600 dark:text-red-400 space-y-1 mb-3">
                  {driveHelp.steps.map((s, i) => (
                    <li key={i}>
                      {driveHelp.steps.length > 1 ? `${i + 1}. ` : ''}
                      {s.split(/(https?:\/\/[^\s]+)/).map((part, j) =>
                        /^https?:\/\//.test(part)
                          ? <a key={j} href={part} target="_blank" rel="noopener noreferrer" className="underline font-medium break-all">{part}</a>
                          : part
                      )}
                    </li>
                  ))}
                </ol>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRetryTest}
                    disabled={testing}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={testing ? 'animate-spin' : ''} />
                    {testing ? '...' : '↺'}
                  </button>
                  <span className="text-xs text-red-400 dark:text-red-500 font-mono">{driveError.code}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-6">
            <div>
              <div className="h-4 w-24 bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-full mb-3 animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 h-28 animate-pulse"
                    style={{ animationDelay: `${i * 80}ms` }} />
                ))}
              </div>
            </div>
          </div>
        ) : isEmpty ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {folders.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📁</span>
                  <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400 tracking-wide">{t('folders')}</h2>
                  <span className="text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 font-bold px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-700">{folders.length}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {folders.map(folder => (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      onClick={() => navigate(`/folder/${folder.id}`)}
                      onDelete={() => handleDeleteFolder(folder)}
                      onRename={() => handleRenameFolder(folder)}
                      isDragTarget={isDragging}
                      dragOverFolderId={dragOverFolderId}
                      onDropWorksheet={handleMoveWorksheet}
                    />
                  ))}
                </div>
              </section>
            )}

            {worksheets.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📄</span>
                  <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400 tracking-wide">{t('worksheets')}</h2>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700">{worksheets.length}</span>
                </div>
                <div className={listView ? 'flex flex-col gap-2' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'}>
                  {worksheets.map(ws => (
                    <WorksheetCard
                      key={ws.id}
                      worksheet={ws}
                      listView={listView}
                      onClick={() => handleViewWorksheet(ws)}
                      onDelete={() => handleDeleteWorksheet(ws)}
                      onPrint={() => handlePrint(ws)}
                      onDocx={() => handleDocx(ws)}
                      onPdf={() => handlePdfDownload(ws)}
                      onDragStart={() => { setIsDragging(true); setDragOverFolderId(null) }}
                      onDragEnd={() => { setIsDragging(false); setDragOverFolderId(null) }}
                      onTouchDragStart={handleTouchDragStart}
                      onTouchDragMove={handleTouchDragMove}
                      onTouchDragEnd={handleTouchDragEnd}
                      onMoveTo={() => setMoveToWorksheet({ id: ws.id, name: ws.name })}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Touch drag floating indicator */}
        {isDragging && touchPos && (
          <div
            className="fixed z-50 pointer-events-none flex items-center gap-2 bg-violet-600 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-2xl"
            style={{ left: touchPos.x + 16, top: touchPos.y - 20 }}
          >
            📄 {dragOverFolderId ? '→ Move here' : 'Drag to a folder'}
          </div>
        )}

        {/* Loading overlay */}
        {wsLoading && (
          <div className="fixed inset-0 bg-black/20 z-40 flex items-center justify-center pointer-events-none">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl px-8 py-6 flex items-center gap-4 pointer-events-auto">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span className="text-slate-700 dark:text-slate-200 font-medium">{t('loading')}</span>
            </div>
          </div>
        )}
      </div>

      {moveToWorksheet && (
        <MoveToModal
          uid={user.uid}
          worksheetName={moveToWorksheet.name}
          currentFolderId={folderId}
          onMove={(targetFolderId) => handleMoveWorksheet(moveToWorksheet.id, targetFolderId)}
          onClose={() => setMoveToWorksheet(null)}
        />
      )}

      {showUpload && (
        <UploadModal
          uid={user.uid}
          folderId={folderId}
          onClose={() => setShowUpload(false)}
          onComplete={() => { setShowUpload(false); load() }}
        />
      )}
      {showNewFolder && (
        <NewFolderModal
          onCreate={handleCreateFolder}
          onClose={() => setShowNewFolder(false)}
        />
      )}
      {viewWorksheet && (
        <WorksheetViewer
          worksheet={viewWorksheet}
          onClose={() => setViewWorksheet(null)}
          onDelete={() => handleDeleteWorksheet(viewWorksheet)}
        />
      )}
    </div>
  )
}

function buildDriveHelp(code) {
  const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID
  if (code === 'db-not-created') {
    return {
      title: 'Firestore database has not been created yet',
      steps: [
        `Create the database in Firebase Console: https://console.firebase.google.com/project/${PROJECT_ID}/firestore`,
        'Click "Create database", choose "Production" or "Test" mode.',
        'Reload this page after creation.',
      ],
    }
  }
  if (code === 'permission-denied' || code === 'forbidden') {
    return {
      title: 'Firestore security rules are blocking access',
      steps: [
        `Open the security rules tab: https://console.firebase.google.com/project/${PROJECT_ID}/firestore/rules`,
        "Paste the following rules and click Publish:",
        `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /users/{uid}/{document=**} {\n      allow read, write: if request.auth != null && request.auth.uid == uid;\n    }\n  }\n}`,
        'Reload after publishing.',
      ],
    }
  }
  return {
    title: `Connection error (${code || 'unknown'})`,
    steps: [
      'Check your internet connection.',
      'Reload the page.',
      'Try signing out and back in if the problem persists.',
    ],
  }
}
