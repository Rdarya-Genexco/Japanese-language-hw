import { useState, useEffect } from 'react'
import { X, Send, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react'
import { submitToClassroom, submitToAssignment, getClassroom, getAssignments } from '../utils/firestoreService'
import { useAuth } from '../contexts/AuthContext'
import { useRole } from '../contexts/RoleContext'

export default function SubmitModal({ worksheetId, worksheetHtml, name, onClose }) {
  const { user } = useAuth()
  const { classroomCode: savedCode } = useRole()

  const [code, setCode] = useState(savedCode || '')
  const [assignments, setAssignments] = useState([])
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  // Load assignments when we have a saved code
  useEffect(() => {
    if (!savedCode) return
    setLoadingAssignments(true)
    getAssignments(savedCode)
      .then(list => {
        setAssignments(list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
      })
      .catch(() => {})
      .finally(() => setLoadingAssignments(false))
  }, [savedCode])

  const handleSubmit = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) { setError('Please enter a classroom code.'); return }
    setSubmitting(true); setError('')
    try {
      const classroom = await getClassroom(trimmed)
      if (!classroom) { setError('Classroom not found. Check the code and try again.'); return }

      if (selectedAssignment) {
        await submitToAssignment(trimmed, selectedAssignment.id, user.uid, user.displayName || '', name, worksheetHtml)
      } else {
        await submitToClassroom(trimmed, user.uid, user.displayName || '', name, worksheetHtml)
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
            <p className="text-white/70 text-xs mt-0.5 truncate max-w-[200px]">"{name}"</p>
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
                Your worksheet has been sent to the teacher.{' '}
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
              {loadingAssignments ? (
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
                  disabled={submitting || !code.trim()}
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
