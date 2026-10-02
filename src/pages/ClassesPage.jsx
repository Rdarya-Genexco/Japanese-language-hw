import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useRole } from '../contexts/RoleContext'
import {
  createClassroom, getTeacherClassrooms, getAssignments,
  getAssignmentSubmissions, getClassroomSubmissions, getClassroomMembers,
  removeClassroomMember, deleteClassroom,
} from '../utils/firestoreService'
import Header from '../components/Header'
import AssignmentModal from '../components/AssignmentModal'
import WorksheetViewer from '../components/WorksheetViewer'
import BottomNav from '../components/BottomNav'
import { ArrowLeft, Plus, Copy, Check, Users, FileText, Loader2, ChevronDown, ChevronRight, Eye, UserMinus, Trash2 } from 'lucide-react'

export default function ClassesPage() {
  const { user } = useAuth()
  const { role, classroomCode, saveClassroomCode } = useRole()
  const navigate = useNavigate()

  useEffect(() => {
    if (role && role !== 'teacher') navigate('/', { replace: true })
  }, [role, navigate])

  const [classrooms, setClassrooms] = useState([])
  const [loadingClassrooms, setLoadingClassrooms] = useState(true)
  const [creating, setCreating] = useState(false)

  const [activeCode, setActiveCode] = useState(null)
  const [copiedCode, setCopiedCode] = useState(null)

  const [members, setMembers] = useState({})
  const [removingUid, setRemovingUid] = useState(null)
  const [viewSubmission, setViewSubmission] = useState(null)
  const [deletingCode, setDeletingCode] = useState(null)
  const [assignments, setAssignments] = useState({})
  const [loadingAssignments, setLoadingAssignments] = useState({})
  const [expandedAssignment, setExpandedAssignment] = useState(null)
  const [submissions, setSubmissions] = useState({})
  const [loadingSubs, setLoadingSubs] = useState({})
  const [generalSubs, setGeneralSubs] = useState({})
  const [loadingGeneralSubs, setLoadingGeneralSubs] = useState({})
  const [expandedGeneral, setExpandedGeneral] = useState(null)

  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [modalCode, setModalCode] = useState(null)

  const fetchedCodesRef = useRef(new Set())

  useEffect(() => {
    getTeacherClassrooms(user.uid)
      .then(setClassrooms)
      .finally(() => setLoadingClassrooms(false))
  }, [user.uid])

  const handleCreateClassroom = async () => {
    setCreating(true)
    try {
      const code = await createClassroom(user.uid)
      saveClassroomCode(code).catch(() => {})
      setClassrooms(prev => [{ code, teacherUid: user.uid, createdAt: { seconds: Date.now() / 1000 } }, ...prev])
      setMembers(p => ({ ...p, [code]: [] }))
      setActiveCode(code)
    } catch (err) {
      alert('Failed to create classroom: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleRemoveMember = async (code, m) => {
    if (!window.confirm(`Remove ${m.name || m.email || 'this student'} from class ${code}?\nThey won't be able to rejoin with this code.`)) return
    setRemovingUid(m.id)
    try {
      await removeClassroomMember(code, m.id)
      setMembers(p => ({ ...p, [code]: (p[code] || []).filter(x => x.id !== m.id) }))
    } catch (err) {
      alert('Failed to remove student: ' + err.message)
    } finally {
      setRemovingUid(null)
    }
  }

  const handleDeleteClass = async (code) => {
    if (!window.confirm(`Delete class ${code}?\nThis permanently deletes its assignments, submissions and student list.`)) return
    setDeletingCode(code)
    try {
      await deleteClassroom(code)
      const remaining = classrooms.filter(c => c.code !== code)
      setClassrooms(remaining)
      setActiveCode(null)
      if (classroomCode === code) saveClassroomCode(remaining[0]?.code || null).catch(() => {})
    } catch (err) {
      alert('Failed to delete class: ' + err.message)
    } finally {
      setDeletingCode(null)
    }
  }

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch {}
  }

  const toggleClassroom = useCallback(async (code) => {
    if (activeCode === code) { setActiveCode(null); return }
    setActiveCode(code)
    if (fetchedCodesRef.current.has(code)) return
    fetchedCodesRef.current.add(code)
    getClassroomMembers(code)
      .then(list => setMembers(p => ({ ...p, [code]: list })))
      .catch(err => {
        console.error('[Classes] could not load students', err)
        setMembers(p => ({ ...p, [code]: null }))
      })
    setLoadingAssignments(p => ({ ...p, [code]: true }))
    try {
      const list = await getAssignments(code)
      setAssignments(p => {
        const optimistic = (p[code] || []).filter(a => !list.some(l => l.id === a.id))
        return {
          ...p,
          [code]: [...list, ...optimistic].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)),
        }
      })
    } catch {
      setAssignments(p => ({ ...p, [code]: p[code] || [] }))
    } finally {
      setLoadingAssignments(p => ({ ...p, [code]: false }))
    }
  }, [activeCode])

  const toggleAssignment = async (code, a) => {
    if (expandedAssignment === a.id) { setExpandedAssignment(null); return }
    setExpandedAssignment(a.id)
    if (submissions[a.id]) return
    setLoadingSubs(p => ({ ...p, [a.id]: true }))
    try {
      const subs = await getAssignmentSubmissions(code, a.id)
      setSubmissions(p => ({
        ...p,
        [a.id]: subs.sort((x, y) => (y.submittedAt?.seconds || 0) - (x.submittedAt?.seconds || 0)),
      }))
    } catch {
      setSubmissions(p => ({ ...p, [a.id]: [] }))
    } finally {
      setLoadingSubs(p => ({ ...p, [a.id]: false }))
    }
  }

  const toggleGeneral = async (code) => {
    if (expandedGeneral === code) { setExpandedGeneral(null); return }
    setExpandedGeneral(code)
    if (generalSubs[code]) return
    setLoadingGeneralSubs(p => ({ ...p, [code]: true }))
    try {
      const subs = await getClassroomSubmissions(code)
      setGeneralSubs(p => ({
        ...p,
        [code]: subs.sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)),
      }))
    } catch {
      setGeneralSubs(p => ({ ...p, [code]: [] }))
    } finally {
      setLoadingGeneralSubs(p => ({ ...p, [code]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      <BottomNav />

      <div className="max-w-2xl mx-auto px-4 py-6 with-bottom-nav">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <ArrowLeft size={16} className="text-slate-600 dark:text-slate-400" />
            </button>
            <div>
              <h1 className="font-bold text-slate-800 dark:text-slate-100 text-xl">My Classes</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {loadingClassrooms
                  ? 'Loading…'
                  : classrooms.length === 0
                    ? 'No classrooms yet'
                    : `${classrooms.length} classroom${classrooms.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <button
            onClick={handleCreateClassroom}
            disabled={creating}
            className="btn-primary flex-shrink-0"
          >
            {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {creating ? 'Creating…' : 'New Class'}
          </button>
        </div>

        {loadingClassrooms ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-10 justify-center">
            <Loader2 size={18} className="animate-spin" /> Loading classrooms…
          </div>
        ) : classrooms.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <p className="text-5xl mb-3">🏫</p>
            <p className="font-semibold text-slate-700 dark:text-slate-200">No classrooms yet</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Create your first classroom to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {classrooms.map(cls => (
              <ClassroomCard
                key={cls.code}
                cls={cls}
                active={activeCode === cls.code}
                copied={copiedCode === cls.code}
                members={members[cls.code]}
                removingUid={removingUid}
                deleting={deletingCode === cls.code}
                onRemoveMember={(m) => handleRemoveMember(cls.code, m)}
                onViewSubmission={setViewSubmission}
                onDeleteClass={() => handleDeleteClass(cls.code)}
                assignments={assignments[cls.code]}
                loadingAssignments={loadingAssignments[cls.code]}
                expandedAssignment={expandedAssignment}
                submissions={submissions}
                loadingSubs={loadingSubs}
                generalSubs={generalSubs[cls.code]}
                loadingGeneralSubs={loadingGeneralSubs[cls.code]}
                expandedGeneral={expandedGeneral === cls.code}
                onToggle={() => toggleClassroom(cls.code)}
                onCopy={() => handleCopy(cls.code)}
                onToggleAssignment={(a) => toggleAssignment(cls.code, a)}
                onToggleGeneral={() => toggleGeneral(cls.code)}
                onNewAssignment={() => { setModalCode(cls.code); setShowAssignmentModal(true) }}
              />
            ))}
          </div>
        )}
      </div>

      {viewSubmission && (
        <WorksheetViewer
          worksheet={{
            name: `${viewSubmission.studentName || 'Student'} — ${viewSubmission.worksheetName || 'Submission'}`,
            worksheetHtml: viewSubmission.worksheetHtml,
            worksheetData: null,
            originalImageUri: null,
            createdAt: viewSubmission.submittedAt?.seconds
              ? { toDate: () => new Date(viewSubmission.submittedAt.seconds * 1000) }
              : null,
          }}
          onClose={() => setViewSubmission(null)}
        />
      )}

      {showAssignmentModal && modalCode && (
        <AssignmentModal
          classroomCode={modalCode}
          onClose={() => { setShowAssignmentModal(false); setModalCode(null) }}
          onCreated={(newA) => {
            const code = modalCode
            setAssignments(prev => ({
              ...prev,
              [code]: [{ ...newA, createdAt: { seconds: Date.now() / 1000 } }, ...(prev[code] || [])],
            }))
          }}
        />
      )}
    </div>
  )
}

function ClassroomCard({
  cls, active, copied, members, removingUid, deleting, onRemoveMember, onDeleteClass, onViewSubmission,
  assignments, loadingAssignments,
  expandedAssignment, submissions, loadingSubs,
  generalSubs, loadingGeneralSubs, expandedGeneral,
  onToggle, onCopy, onToggleAssignment, onToggleGeneral, onNewAssignment,
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

      {/* Classroom header */}
      <div className="flex items-center gap-3 p-4">
        <button onClick={onToggle} className="flex-1 flex items-center gap-3 text-left min-w-0">
          <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users size={18} className="text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="min-w-0">
            <p className="font-black font-mono text-xl tracking-widest text-cyan-600 dark:text-cyan-400">
              {cls.code}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {assignments !== undefined
                ? [
                    members && `${members.length} student${members.length !== 1 ? 's' : ''}`,
                    `${assignments.length} assignment${assignments.length !== 1 ? 's' : ''}`,
                  ].filter(Boolean).join(' · ')
                : 'Tap to view'}
            </p>
          </div>
        </button>
        <button
          onClick={onCopy}
          className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
            copied
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button onClick={onToggle} className="p-1 flex-shrink-0">
          {active
            ? <ChevronDown size={16} className="text-slate-400" />
            : <ChevronRight size={16} className="text-slate-400" />}
        </button>
      </div>

      {/* Expanded content */}
      {active && (
        <div className="border-t border-slate-100 dark:border-slate-700">

          {/* Students */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-3">
              <Users size={13} className="text-cyan-500" />
              Students
              {members?.length > 0 && (
                <span className="bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                  {members.length}
                </span>
              )}
            </h3>
            {members === undefined ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-3 justify-center">
                <Loader2 size={13} className="animate-spin" /> Loading…
              </div>
            ) : members === null ? (
              <p className="text-xs text-rose-500 text-center py-3">
                Couldn't load students. Check that the latest Firestore rules are published to the "lang" database.
              </p>
            ) : members.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">
                No students yet. Share the code <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{cls.code}</span> so they can join from Settings.
              </p>
            ) : (
              <div className="space-y-1.5">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900/30 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700">
                    {m.photoURL ? (
                      <img src={m.photoURL} alt="" referrerPolicy="no-referrer" className="w-7 h-7 rounded-full flex-shrink-0 object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full flex-shrink-0 bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-xs font-bold flex items-center justify-center">
                        {(m.name || m.email || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{m.name || 'Student'}</p>
                      {m.email && <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{m.email}</p>}
                    </div>
                    {m.joinedAt?.seconds && (
                      <p className="text-[10px] text-slate-400 flex-shrink-0">
                        Joined {new Date(m.joinedAt.seconds * 1000).toLocaleDateString()}
                      </p>
                    )}
                    <button
                      onClick={() => onRemoveMember(m)}
                      disabled={removingUid === m.id}
                      title="Remove from class"
                      aria-label={`Remove ${m.name || m.email || 'student'} from class`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 disabled:opacity-50 transition-colors flex-shrink-0"
                    >
                      {removingUid === m.id ? <Loader2 size={14} className="animate-spin" /> : <UserMinus size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assignments */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <FileText size={13} className="text-violet-500" />
                Assignments
                {assignments?.length > 0 && (
                  <span className="bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                    {assignments.length}
                  </span>
                )}
              </h3>
              <button
                onClick={onNewAssignment}
                className="flex items-center gap-1 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Plus size={11} /> New
              </button>
            </div>

            {loadingAssignments ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-3 justify-center">
                <Loader2 size={13} className="animate-spin" /> Loading…
              </div>
            ) : !assignments || assignments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">No assignments yet.</p>
            ) : (
              <div className="space-y-1.5">
                {assignments.map(a => (
                  <div key={a.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <button
                      onClick={() => onToggleAssignment(a)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs truncate">{a.title}</p>
                        {a.description && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{a.description}</p>
                        )}
                        {a.dueDate && (
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Due: {a.dueDate}</p>
                        )}
                        {a.attachedWorksheetName && (
                          <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-0.5 truncate">📎 {a.attachedWorksheetName}</p>
                        )}
                      </div>
                      {loadingSubs[a.id] ? (
                        <Loader2 size={12} className="animate-spin text-slate-400 flex-shrink-0" />
                      ) : expandedAssignment === a.id ? (
                        <ChevronDown size={12} className="text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight size={12} className="text-slate-400 flex-shrink-0" />
                      )}
                    </button>

                    {expandedAssignment === a.id && !loadingSubs[a.id] && (
                      <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 px-3 py-2">
                        {(submissions[a.id] || []).length === 0 ? (
                          <p className="text-[10px] text-slate-400 text-center py-2">No submissions yet.</p>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-slate-500 mb-1.5">
                              {submissions[a.id].length} submission{submissions[a.id].length !== 1 ? 's' : ''}
                            </p>
                            {submissions[a.id].map(s => (
                              <SubmissionRow key={s.id} s={s} icon="👤" onView={onViewSubmission}
                                className="bg-white dark:bg-slate-800 rounded-lg px-2.5 py-1.5" />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* General submissions */}
          <div className="p-4">
            <button
              onClick={onToggleGeneral}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2"
            >
              <span className="flex items-center gap-1.5">
                <Eye size={13} className="text-emerald-500" /> General Submissions
              </span>
              {expandedGeneral
                ? <ChevronDown size={13} className="text-slate-400" />
                : <ChevronRight size={13} className="text-slate-400" />}
            </button>

            {expandedGeneral && (
              loadingGeneralSubs ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-3 justify-center">
                  <Loader2 size={13} className="animate-spin" /> Loading…
                </div>
              ) : !generalSubs || generalSubs.length === 0 ? (
                <p className="text-[10px] text-slate-400 text-center py-2">No general submissions yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {generalSubs.map(s => (
                    <SubmissionRow key={s.id} s={s} icon="📄" onView={onViewSubmission}
                      className="bg-slate-50 dark:bg-slate-900/30 rounded-xl px-2.5 py-2" />
                  ))}
                </div>
              )
            )}
          </div>

          {/* Danger zone */}
          <div className="px-4 pb-4">
            <button
              onClick={onDeleteClass}
              disabled={deleting}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-60 py-2 rounded-xl transition-colors"
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              {deleting ? 'Deleting…' : 'Delete class'}
            </button>
          </div>

        </div>
      )}
    </div>
  )
}

function SubmissionRow({ s, icon, onView, className }) {
  const canView = !!s.worksheetHtml
  return (
    <button
      type="button"
      onClick={() => canView && onView(s)}
      disabled={!canView}
      className={`w-full flex items-center gap-2 text-[10px] text-left border border-slate-200 dark:border-slate-700 transition-colors enabled:hover:border-blue-300 dark:enabled:hover:border-blue-600 enabled:hover:bg-blue-50 dark:enabled:hover:bg-blue-900/20 ${className}`}
    >
      <span className="text-sm flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{s.studentName || 'Student'}</p>
        <p className="text-slate-400 truncate">{s.worksheetName || s.name || (canView ? 'Worksheet' : 'Feedback only')}</p>
        {s.feedback && (
          <p className="mt-1 text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md px-2 py-1">
            💬 {s.feedback}
          </p>
        )}
      </div>
      {s.submittedAt?.seconds && (
        <span className="text-slate-400 flex-shrink-0">{new Date(s.submittedAt.seconds * 1000).toLocaleDateString()}</span>
      )}
      {canView && <span className="text-blue-500 dark:text-blue-400 font-semibold flex-shrink-0">View ›</span>}
    </button>
  )
}
