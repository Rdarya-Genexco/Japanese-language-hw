import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useRole } from '../contexts/RoleContext'
import {
  createClassroom, getAssignments, getAssignmentSubmissions, getClassroomSubmissions,
} from '../utils/firestoreService'
import Header from '../components/Header'
import AssignmentModal from '../components/AssignmentModal'
import { ArrowLeft, Plus, Copy, Check, Users, FileText, Loader2, ChevronDown, ChevronRight, Eye } from 'lucide-react'

export default function ClassesPage() {
  const { user } = useAuth()
  const { classroomCode, saveClassroomCode } = useRole()
  const navigate = useNavigate()

  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [assignments, setAssignments] = useState([])
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [expandedAssignment, setExpandedAssignment] = useState(null)
  const [submissions, setSubmissions] = useState({}) // assignmentId → []
  const [loadingSubs, setLoadingSubs] = useState({})
  const [generalSubs, setGeneralSubs] = useState([])
  const [loadingGeneralSubs, setLoadingGeneralSubs] = useState(false)
  const [expandedGeneral, setExpandedGeneral] = useState(false)

  const loadAssignments = useCallback(async () => {
    if (!classroomCode) return
    setLoadingAssignments(true)
    try {
      const list = await getAssignments(classroomCode)
      setAssignments(list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
    } catch {
      // silent
    } finally {
      setLoadingAssignments(false)
    }
  }, [classroomCode])

  useEffect(() => { loadAssignments() }, [loadAssignments])

  const handleCreateClassroom = async () => {
    setCreating(true)
    try {
      const code = await createClassroom(user.uid)
      await saveClassroomCode(code)
    } catch (err) {
      alert('Failed to create classroom: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(classroomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const toggleAssignment = async (a) => {
    if (expandedAssignment === a.id) {
      setExpandedAssignment(null)
      return
    }
    setExpandedAssignment(a.id)
    if (submissions[a.id]) return
    setLoadingSubs(p => ({ ...p, [a.id]: true }))
    try {
      const subs = await getAssignmentSubmissions(classroomCode, a.id)
      setSubmissions(p => ({ ...p, [a.id]: subs }))
    } catch {
      setSubmissions(p => ({ ...p, [a.id]: [] }))
    } finally {
      setLoadingSubs(p => ({ ...p, [a.id]: false }))
    }
  }

  const toggleGeneral = async () => {
    if (expandedGeneral) { setExpandedGeneral(false); return }
    setExpandedGeneral(true)
    if (generalSubs.length > 0) return
    setLoadingGeneralSubs(true)
    try {
      const subs = await getClassroomSubmissions(classroomCode)
      setGeneralSubs(subs.sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)))
    } catch {
      setGeneralSubs([])
    } finally {
      setLoadingGeneralSubs(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Page header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/')}
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <ArrowLeft size={16} className="text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="font-bold text-slate-800 dark:text-slate-100 text-xl">My Classes</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage your classroom and assignments</p>
          </div>
        </div>

        {/* Classroom card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 mb-4">
          <h2 className="font-semibold text-slate-700 dark:text-slate-300 text-sm mb-3 flex items-center gap-2">
            <Users size={15} className="text-blue-500" /> Classroom
          </h2>

          {classroomCode ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-700 rounded-xl py-3 text-center">
                <p className="font-black font-mono text-2xl tracking-widest text-cyan-600 dark:text-cyan-400">
                  {classroomCode}
                </p>
                <p className="text-xs text-cyan-500 dark:text-cyan-500 mt-0.5">Share with students</p>
              </div>
              <button
                onClick={handleCopy}
                className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleCreateClassroom}
              disabled={creating}
              className="btn-primary w-full justify-center"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : '🏫'}
              {creating ? 'Creating…' : 'Create Classroom'}
            </button>
          )}
        </div>

        {/* Assignments section */}
        {classroomCode && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
                <FileText size={15} className="text-violet-500" />
                Assignments
                {assignments.length > 0 && (
                  <span className="text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 font-bold px-2 py-0.5 rounded-full">
                    {assignments.length}
                  </span>
                )}
              </h2>
              <button
                onClick={() => setShowAssignmentModal(true)}
                className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus size={13} /> New Assignment
              </button>
            </div>

            {loadingAssignments ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-4 justify-center">
                <Loader2 size={16} className="animate-spin" /> Loading…
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-4xl mb-2">📋</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">No assignments yet.</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Create one so students can submit their work.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {assignments.map(a => (
                  <div key={a.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleAssignment(a)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{a.title}</p>
                        {a.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{a.description}</p>
                        )}
                        {a.dueDate && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Due: {a.dueDate}</p>
                        )}
                      </div>
                      {loadingSubs[a.id] ? (
                        <Loader2 size={14} className="animate-spin text-slate-400 flex-shrink-0" />
                      ) : expandedAssignment === a.id ? (
                        <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />
                      )}
                    </button>

                    {expandedAssignment === a.id && !loadingSubs[a.id] && (
                      <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 px-4 py-3">
                        {(submissions[a.id] || []).length === 0 ? (
                          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-2">No submissions yet.</p>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                              {submissions[a.id].length} submission{submissions[a.id].length !== 1 ? 's' : ''}
                            </p>
                            {submissions[a.id].map(s => (
                              <div key={s.id} className="flex items-center gap-2 text-xs bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
                                <span className="text-base flex-shrink-0">👤</span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-700 dark:text-slate-200 truncate">
                                    {s.studentName || 'Student'}
                                  </p>
                                  <p className="text-slate-400 dark:text-slate-500 truncate">{s.worksheetName}</p>
                                </div>
                              </div>
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
        )}

        {/* General submissions */}
        {classroomCode && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <button
              onClick={toggleGeneral}
              className="w-full flex items-center justify-between"
            >
              <h2 className="font-semibold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
                <Eye size={15} className="text-emerald-500" /> General Submissions
              </h2>
              {expandedGeneral ? (
                <ChevronDown size={14} className="text-slate-400" />
              ) : (
                <ChevronRight size={14} className="text-slate-400" />
              )}
            </button>

            {expandedGeneral && (
              <div className="mt-4">
                {loadingGeneralSubs ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400 py-4 justify-center">
                    <Loader2 size={16} className="animate-spin" /> Loading…
                  </div>
                ) : generalSubs.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">No general submissions yet.</p>
                ) : (
                  <div className="space-y-2">
                    {generalSubs.map(s => (
                      <div key={s.id} className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-900/30 rounded-xl px-3 py-2.5 border border-slate-200 dark:border-slate-700">
                        <span className="text-base flex-shrink-0">📄</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-700 dark:text-slate-200 truncate">
                            {s.studentName || 'Student'}
                          </p>
                          <p className="text-slate-400 dark:text-slate-500 truncate">{s.worksheetName || s.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showAssignmentModal && classroomCode && (
        <AssignmentModal
          classroomCode={classroomCode}
          onClose={() => setShowAssignmentModal(false)}
          onCreated={(newA) => {
            setAssignments(prev => [{ ...newA, createdAt: { seconds: Date.now() / 1000 } }, ...prev])
          }}
        />
      )}
    </div>
  )
}
