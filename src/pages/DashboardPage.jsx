import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'
import { useRole } from '../contexts/RoleContext'
import {
  getFolders, getWorksheets, getWorksheet,
  createFolder, deleteFolder, deleteWorksheet,
  renameFolder, buildBreadcrumb, testFirestoreConnection, moveWorksheet,
  getAssignments, getMyAssignmentSubmissions, unsubmitAssignment,
} from '../utils/storageService'
import { openPrintView, printWorksheetHtml, hydrateWorksheetHtml, downloadAsDocx, downloadAsPdf, downloadAsPdfFromHtml, downloadAsDocxFromHtml } from '../utils/worksheetGenerator'
import Header from '../components/Header'
import Breadcrumb from '../components/Breadcrumb'
import FolderCard from '../components/FolderCard'
import WorksheetCard from '../components/WorksheetCard'
import UploadModal from '../components/UploadModal'
import NewFolderModal from '../components/NewFolderModal'
import WorksheetViewer from '../components/WorksheetViewer'
import SubmitModal from '../components/SubmitModal'
import { dueStatus, overdueText } from '../utils/dueDates'
import { errorText } from '../utils/appError'
import EmptyState from '../components/EmptyState'
import { FolderPlus, Upload, RefreshCw, LayoutGrid, List, School, ClipboardList } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import { firebaseConfig } from '../firebase/config'

export default function DashboardPage() {
  const { user }              = useAuth()
  const { t, formatDate }     = useLang()
  const { role, classroomCode } = useRole()
  const { folderId = 'root' } = useParams()
  const navigate              = useNavigate()
  const location              = useLocation()

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
  const [listView,         setListView]         = useState(false)
  const [assignments,      setAssignments]      = useState([])
  const [viewAssignment,   setViewAssignment]   = useState(null)
  const [submitAssignment, setSubmitAssignment] = useState(null)
  const [submitted,        setSubmitted]        = useState({}) // assignmentId → true/false; missing = still checking
  const [unsubmittingId,   setUnsubmittingId]   = useState(null)
  const [showAllAssignments, setShowAllAssignments] = useState(false)
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

  // Upload tapped in the bottom nav on another page: open the dialog here, then clear the
  // request so Back doesn't reopen it
  useEffect(() => {
    if (!location.state?.openUpload) return
    setShowUpload(true)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.state, location.pathname, navigate])

  // Load assignments for students who have a classroom code
  useEffect(() => {
    if (role !== 'student' || !classroomCode || folderId !== 'root') return
    getAssignments(classroomCode).then(async list => {
      const sorted = list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setAssignments(sorted)
      const entries = await Promise.all(sorted.map(a =>
        getMyAssignmentSubmissions(classroomCode, a.id, user.uid)
          .then(subs => [a.id, subs.length > 0])
          .catch(() => [a.id, false])))
      setSubmitted(Object.fromEntries(entries))
    }).catch(() => {})
  }, [role, classroomCode, folderId, user.uid])

  const handleUnsubmit = (a) => {
    setTimeout(async () => {
      if (!window.confirm(t('confirmUnsubmit', { title: a.title }))) return
      setUnsubmittingId(a.id)
      try {
        await unsubmitAssignment(classroomCode, a.id, user.uid)
        setSubmitted(p => ({ ...p, [a.id]: false }))
      } catch (err) {
        alert(t('failedUnsubmit') + ': ' + errorText(err, t))
      } finally {
        setUnsubmittingId(null)
      }
    }, 0)
  }

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
        printWorksheetHtml(hydrateWorksheetHtml(full.worksheetHtml, full.originalImageUri))
      } else {
        openPrintView(full.worksheetData)
      }
    } catch (err) { alert(t('printFailed') + ': ' + errorText(err, t)) }
    finally  { setWsLoading(false) }
  }

  const handleDocx = async (ws) => {
    setWsLoading(true)
    try {
      const full = await getWorksheet(user.uid, ws.id)
      if (full.worksheetHtml) {
        const html = hydrateWorksheetHtml(full.worksheetHtml, full.originalImageUri)
        await downloadAsDocxFromHtml(html, (ws.name || 'worksheet').replace(/\.[^.]+$/, ''))
      } else {
        await downloadAsDocx(full.worksheetData)
      }
    } catch (err) { alert(t('wordFailed') + ': ' + errorText(err, t)) }
    finally  { setWsLoading(false) }
  }

  const handlePdfDownload = async (ws) => {
    setWsLoading(true)
    try {
      const full = await getWorksheet(user.uid, ws.id)
      if (full.worksheetHtml) {
        const html = hydrateWorksheetHtml(full.worksheetHtml, full.originalImageUri)
        await downloadAsPdfFromHtml(html, (ws.name || 'worksheet').replace(/\.[^.]+$/, ''))
      } else {
        await downloadAsPdf(full.worksheetData)
      }
    } catch (err) { alert(t('pdfFailed') + ': ' + errorText(err, t)) }
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
      try {
        await deleteFolder(user.uid, folder.id)
      } catch (err) {
        alert(t('failedDeleteFolder') + ': ' + errorText(err, t))
      }
      load()
    }, 0)
  }

  const handleRenameFolder = (folder) => {
    setTimeout(async () => {
      const raw = window.prompt(`${t('folderName')}:`, folder.name)
      const name = raw?.trim()
      if (!name || name === folder.name) return
      try {
        await renameFolder(user.uid, folder.id, name)
        load()
      } catch (err) {
        alert(t('failedRenameFolder') + ': ' + errorText(err, t))
      }
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
      alert(t('failedMoveWorksheet') + ': ' + errorText(err, t))
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
      try {
        await deleteWorksheet(user.uid, ws.id)
        if (viewWorksheet?.id === ws.id) setViewWorksheet(null)
        load()
      } catch (err) {
        alert(t('failedDeleteWorksheet') + ': ' + errorText(err, t))
      }
    }, 0)
  }

  const isEmpty = !loading && folders.length === 0 && worksheets.length === 0

  // Error help text (kept in English for technical content)
  const driveHelp = driveError ? buildDriveHelp(driveError.code, t) : null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Header streak={streak} />
      <BottomNav onUpload={() => setShowUpload(true)} />

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 with-bottom-nav">

        {/* Student motivational banner */}
        {role === 'student' && folderId === 'root' && !loading && (
          <div className="mb-4 space-y-3">
            {/* Main welcome banner */}
            <div className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-400 dark:from-violet-700 dark:via-fuchsia-700 dark:to-amber-600 rounded-3xl p-5 relative overflow-hidden shadow-lg shadow-fuchsia-500/20">
              {/* Decorative circles */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/20 rounded-full" />
              <div className="absolute -bottom-6 right-28 w-16 h-16 bg-yellow-200/30 rounded-full" />
              <div className="flex items-center gap-4 relative">
                <span className="text-5xl flex-shrink-0 drop-shadow-md animate-bounce" style={{ animationDuration: '2s' }}>🎒</span>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-white text-lg drop-shadow-sm">
                    {user?.displayName ? t('greeting', { name: user.displayName.split(' ')[0] }) : t('welcomeBack')}
                  </p>
                  <p className="text-white/90 text-sm mt-0.5">
                    {worksheets.length === 0
                      ? t('uploadFirstWorksheet')
                      : worksheets.length < 3
                      ? t('keepGoing', { count: worksheets.length })
                      : t('onARoll', { count: worksheets.length })}
                  </p>
                </div>
                {streak > 0 && (
                  <div className="flex-shrink-0 bg-white/25 backdrop-blur-sm rounded-2xl px-4 py-2 text-center ring-2 ring-white/40 rotate-3">
                    <p className="text-3xl font-black text-white leading-none">{streak}</p>
                    <p className="text-white/90 text-sm mt-0.5">{t('streakLabel')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Achievement badges */}
            <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar">
              {[
                { icon: '🌱', label: t('badgeStarted'), done: worksheets.length >= 1 },
                { icon: '📚', label: t('badgeSheets', { count: 3 }), done: worksheets.length >= 3 },
                { icon: '⭐', label: t('badgeSheets', { count: 5 }), done: worksheets.length >= 5 },
                { icon: '🏆', label: t('badgeSheets', { count: 10 }), done: worksheets.length >= 10 },
              ].map(badge => (
                <div
                  key={badge.label}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl border-2 text-center transition-all ${
                    badge.done
                      ? 'bg-gradient-to-b from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/20 border-amber-300 dark:border-amber-600 shadow-sm shadow-amber-500/20 hover:-translate-y-1 hover:rotate-2'
                      : 'bg-white dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-700 opacity-50 grayscale'
                  }`}
                >
                  <span className="text-2xl leading-none">{badge.done ? badge.icon : '🔒'}</span>
                  <span className={`text-xs font-semibold ${badge.done ? 'text-amber-700 dark:text-amber-400' : 'text-slate-400'}`}>
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Assignments from teacher */}
            {assignments.length > 0 && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardList size={15} className="text-fuchsia-500" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('assignments')}</span>
                  <span className="text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-semibold px-2 py-0.5 rounded-full">
                    {assignments.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {(showAllAssignments ? assignments : assignments.slice(0, 3)).map(a => {
                    const due = dueStatus(a)
                    const closed = due.state === 'closed'
                    return (
                    <div
                      key={a.id}
                      onClick={() => a.attachedWorksheetHtml && setViewAssignment(a)}
                      className={`flex items-center gap-3 bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/10 ring-1 ring-violet-200/60 dark:ring-violet-500/20 rounded-2xl px-3.5 py-3 transition-all ${
                        a.attachedWorksheetHtml
                          ? 'cursor-pointer hover:ring-violet-400 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]'
                          : ''
                      }`}
                    >
                      <span className="text-lg flex-shrink-0">{a.attachedWorksheetHtml ? '📄' : '📋'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{a.title}</p>
                        {a.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{a.description}</p>
                        )}
                        {a.dueDate && <p className="text-xs text-amber-600 dark:text-amber-400">{t('dueOn', { date: formatDate(a.dueDate) })}</p>}
                        {!submitted[a.id] && overdueText(due, t) && (
                          <p className={`text-xs font-semibold ${closed ? 'text-rose-600 dark:text-rose-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            ⚠️ {overdueText(due, t)}
                          </p>
                        )}
                      </div>
                      {a.attachedWorksheetHtml && (
                        <span className="flex-shrink-0 text-xs text-violet-600 dark:text-violet-400 font-semibold">{t('viewArrow')}</span>
                      )}
                      {submitted[a.id] ? (
                        <div className="flex-shrink-0 flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{t('submittedCheck')}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUnsubmit(a) }}
                            disabled={unsubmittingId === a.id || closed}
                            title={closed ? t('deadlinePassed') : undefined}
                            className="text-xs font-semibold border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            {unsubmittingId === a.id ? '…' : t('unsubmit')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSubmitAssignment(a) }}
                          disabled={submitted[a.id] === undefined || closed}
                          className="flex-shrink-0 text-xs font-semibold bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                        >
                          {closed ? t('closed') : t('submit')}
                        </button>
                      )}
                    </div>
                  )})}
                </div>
                {assignments.length > 3 && (
                  <button
                    onClick={() => setShowAllAssignments(v => !v)}
                    className="mt-3 w-full text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 font-medium text-center py-2 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                  >
                    {showAllAssignments ? t('showLess') : t('seeAllAssignments', { count: assignments.length })}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Teacher stats row */}
        {role === 'teacher' && folderId === 'root' && !loading && (
          <div className="mb-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-4 text-center">
                <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{worksheets.length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('worksheets')}</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-3xl font-bold tracking-tight text-violet-600 dark:text-violet-400">{folders.length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('folders')}</p>
              </div>
              <button
                onClick={() => navigate('/classes')}
                className="card p-4 text-center hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-md transition-all"
              >
                <p className="text-2xl">🏫</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('classesLink')}</p>
              </button>
            </div>
            <button
              onClick={() => navigate('/classes')}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold py-3 rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <School size={15} /> {t('manageClasses')}
            </button>
          </div>
        )}

        {/* Breadcrumb + action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200/80 dark:border-white/10">
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
                title={listView ? t('gridView') : t('listView')}
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
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-full mb-3 animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200 dark:ring-white/10 p-4 h-28 animate-pulse"
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
                  <h2 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">{t('folders')}</h2>
                  <span className="text-xs bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold px-2 py-0.5 rounded-full">{folders.length}</span>
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
                  <h2 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">{t('worksheets')}</h2>
                  <span className="text-xs bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold px-2 py-0.5 rounded-full">{worksheets.length}</span>
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
            📄 {dragOverFolderId ? t('moveHereArrow') : t('dragToFolder')}
          </div>
        )}

        {/* Loading overlay */}
        {wsLoading && (
          <div className="fixed inset-0 bg-slate-950/30 backdrop-blur-sm z-40 flex items-center justify-center pointer-events-none">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 px-8 py-6 flex items-center gap-4 pointer-events-auto">
              <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span className="text-slate-700 dark:text-slate-200 font-medium">{t('loading')}</span>
            </div>
          </div>
        )}
      </div>


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
      {viewAssignment && (
        <WorksheetViewer
          worksheet={{
            name: viewAssignment.attachedWorksheetName || viewAssignment.title,
            worksheetHtml: viewAssignment.attachedWorksheetHtml,
            worksheetData: null,
            originalImageUri: null,
            createdAt: viewAssignment.createdAt,
          }}
          onClose={() => setViewAssignment(null)}
        />
      )}
      {submitAssignment && (
        <SubmitModal
          assignment={submitAssignment}
          onSubmitted={(id) => setSubmitted(p => ({ ...p, [id]: true }))}
          onClose={() => setSubmitAssignment(null)}
        />
      )}
    </div>
  )
}

function buildDriveHelp(code, t) {
  const consoleUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore`
  if (code === 'db-not-created') {
    return {
      title: t('dbNotCreatedTitle'),
      steps: [t('dbNotCreatedStep1', { url: consoleUrl }), t('reloadAfter')],
    }
  }
  if (code === 'permission-denied' || code === 'forbidden') {
    return {
      title: t('rulesBlockingTitle'),
      steps: [t('rulesBlockingStep1', { url: `${consoleUrl}/databases/lang/rules` }), t('rulesBlockingStep2'), t('reloadAfter')],
    }
  }
  return {
    title: t('connectionErrorTitle', { code: code || 'unknown' }),
    steps: [t('checkConnection'), t('reloadPage'), t('signOutIn')],
  }
}
