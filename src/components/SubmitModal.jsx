import { useState, useEffect } from 'react'
import { X, Send, CheckCircle, AlertCircle } from 'lucide-react'
import {
  submitToClassroom, submitToAssignment, getClassroom, getAssignments, getAllWorksheets, getWorksheet,
} from '../utils/firestoreService'
import { hydrateWorksheetHtml } from '../utils/worksheetGenerator'
import { useAuth } from '../contexts/AuthContext'
import { useRole } from '../contexts/RoleContext'

/**
 * Opened from a worksheet (worksheetHtml + name given) or from an assignment (assignment given,
 * attaching a worksheet optional). A submission needs a worksheet, feedback, or both.
 */
export default function SubmitModal({ worksheetHtml, name, assignment = null, onClose }) {
  const { user } = useAuth()
  const { classroomCode: savedCode } = useRole()
  const hasWorksheet = !!worksheetHtml

  const [code, setCode] = useState(savedCode || '')
  const [assignments, setAssignments] = useState([])
  const [selectedAssignment, setSelectedAssignment] = useState(assignment)
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [myWorksheets, setMyWorksheets] = useState([])
  const [attachId, setAttachId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (hasWorksheet) return
    getAllWorksheets(user.uid).then(setMyWorksheets)
  }, [hasWorksheet, user.uid])

  // Load assignments when we have a saved code
  useEffect(() => {
    if (!savedCode || assignment) return
    setLoadingAssignments(true)
    getAssignments(savedCode)
      .then(list => {
        setAssignments(list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
      })
      .catch(() => {})
      .finally(() => setLoadingAssignments(false))
  }, [savedCode, assignment])

  const trimmedFeedback = feedback.trim()
  const canSubmit = !!code.trim() && (hasWorksheet || !!attachId || !!trimmedFeedback)

  const handleSubmit = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) { setError('Please enter a classroom code.'); return }
    if (!canSubmit) { setError('Attach a worksheet or write some feedback.'); return }
    setSubmitting(true); setError('')
    try {
      const classroom = await getClassroom(trimmed)
      if (!classroom) { setError('Classroom not found. Check the code and try again.'); return }

      let wsName = name || ''
      let wsHtml = worksheetHtml || ''
      if (!hasWorksheet && attachId) {
        const full = await getWorksheet(user.uid, attachId)
        if (!full.worksheetHtml) { setError("This worksheet uses an old format and can't be attached."); return }
        wsName = full.name
        wsHtml = hydrateWorksheetHtml(full.worksheetHtml, full.originalImageUri)
      }

      const args = [user.uid, user.displayName || '', wsName, wsHtml, trimmedFeedback]
      if (selectedAssignment) {
        await submitToAssignment(trimmed, selectedAssignment.id, ...args)
      } else {
        await submitToClassroom(trimmed, ...args)
      }
      setDone(true)
    } catch (err) {
      setError('Submission failed: ' + (err.message || 'Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-5 pt-5 pb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white">Submit to Teacher</h2>
            <p className="text-white/70 text-xs mt-0.5 truncate max-w-[200px]">
              {hasWorksheet ? `"${name}"` : assignment ? assignment.title : 'Feedback or worksheet'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            <X size={15} className="text-white" />
          </button>
        </div>

        <div className="px-5 py-5">
          {done ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-3">🎉</div>
              <CheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Submitted!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Sent to your teacher.{' '}
                {selectedAssignment && <span className="font-medium">Assignment: {selectedAssignment.title}</span>}
              </p>
              <button onClick={onClose} className="btn-primary justify-center w-full text-sm">
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Classroom code field */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Classroom Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
                  placeholder="e.g. AB12CD"
                  maxLength={10}
                  className="input w-full uppercase tracking-widest font-mono text-center text-lg"
                  readOnly={!!savedCode}
                />
                {savedCode && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 text-center">✓ Saved classroom</p>
                )}
              </div>

              {/* Assignment picker */}
              {assignment ? (
                <div className="mb-4 px-3 py-2 rounded-xl border border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-300">
                  <div className="font-semibold">{assignment.title}</div>
                  {assignment.dueDate && <div className="text-slate-400 mt-0.5">Due: {assignment.dueDate}</div>}
                </div>
              ) : loadingAssignments ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                  <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                  Loading assignments…
                </div>
              ) : assignments.length > 0 && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Assignment (optional)
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    <button
                      onClick={() => setSelectedAssignment(null)}
                      className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-colors ${
                        !selectedAssignment
                          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      General submission
                    </button>
                    {assignments.map(a => (
                      <button
                        key={a.id}
                        onClick={() => setSelectedAssignment(a)}
                        className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-colors ${
                          selectedAssignment?.id === a.id
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-semibold">{a.title}</div>
                        {a.dueDate && <div className="text-slate-400 mt-0.5">Due: {a.dueDate}</div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!hasWorksheet && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Attach a worksheet (optional)
                  </label>
                  <select
                    value={attachId}
                    onChange={e => { setAttachId(e.target.value); setError('') }}
                    className="input w-full text-sm"
                  >
                    <option value="">No worksheet</option>
                    {myWorksheets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Feedback {hasWorksheet || attachId ? '(optional)' : ''}
                </label>
                <textarea
                  value={feedback}
                  onChange={e => { setFeedback(e.target.value); setError('') }}
                  placeholder="How did it go? Anything you found hard or want to ask?"
                  maxLength={2000}
                  rows={3}
                  className="input w-full text-sm resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-2.5 mb-3">
                  <AlertCircle size={13} className="text-rose-500 flex-shrink-0" />
                  <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={onClose} className="btn-secondary flex-1 justify-center text-sm">
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !canSubmit}
                  className="btn-primary flex-1 justify-center text-sm"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  Submit
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
