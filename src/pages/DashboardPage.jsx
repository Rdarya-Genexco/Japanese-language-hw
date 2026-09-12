import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'
import {
  getFolders, getWorksheets, getWorksheet,
  createFolder, deleteFolder, deleteWorksheet,
  renameFolder, buildBreadcrumb, testFirestoreConnection, moveWorksheet, getAllFolders,
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
import { FolderPlus, Upload, RefreshCw } from 'lucide-react'

const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID

export default function DashboardPage() {
  const { user }              = useAuth()
  const { t }                 = useLang()
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
  const handlePrint = async (ws) => {
    setWsLoading(true)
    try {
      const full = await getWorksheet(user.uid, ws.id)
      if (full.worksheetHtml) {
        const win = window.open('', '_blank')
        if (!win) { alert('Please allow popups for this site and try again.'); return }
        win.document.write(full.worksheetHtml)
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
        await downloadAsDocxFromHtml(full.worksheetHtml, (ws.name || 'worksheet').replace(/\.[^.]+$/, ''))
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
        await downloadAsPdfFromHtml(full.worksheetHtml, (ws.name || 'worksheet').replace(/\.[^.]+$/, ''))
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
      <Header />

      <div className="max-w-6xl mx-auto w-full px-4 py-4 flex-1">

        {/* Breadcrumb + action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <Breadcrumb
            items={breadcrumb}
            isDragTarget={isDragging}
            onDropWorksheet={handleMoveWorksheet}
          />
          <div className="flex items-center gap-2">
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
          <EmptyState
            onUpload={() => setShowUpload(true)}
            onNewFolder={() => setShowNewFolder(true)}
          />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {worksheets.map(ws => (
                    <WorksheetCard
                      key={ws.id}
                      worksheet={ws}
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
