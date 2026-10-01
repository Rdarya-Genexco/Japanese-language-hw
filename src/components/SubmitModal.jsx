import { useState } from 'react'
import { X, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { submitToClassroom, getClassroom } from '../utils/firestoreService'
import { useAuth } from '../contexts/AuthContext'

export default function SubmitModal({ worksheetId, worksheetHtml, name, onClose }) {
  const { user } = useAuth()
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) { setError('Please enter a classroom code.'); return }
    setSubmitting(true); setError('')
    try {
      const classroom = await getClassroom(trimmed)
      if (!classroom) { setError('Classroom not found. Check the code and try again.'); return }
      await submitToClassroom(trimmed, user.uid, name, worksheetHtml)
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
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-5 pt-5 pb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white">Submit to Teacher</h2>
            <p className="text-white/70 text-xs mt-0.5">Enter your classroom code</p>
          </div>
          <button onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            <X size={15} className="text-white" />
          </button>
        </div>

        <div className="px-5 py-5">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle size={40} className="text-emerald-500 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Submitted!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Your worksheet has been sent to the teacher.
              </p>
              <button onClick={onClose} className="btn-primary justify-center w-full text-sm">
                Done
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Ask your teacher for the classroom code, then enter it below to submit
                <span className="font-semibold"> "{name}"</span>.
              </p>
              <input
                type="text"
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
                placeholder="e.g. AB12CD"
                maxLength={10}
                className="input mb-3 uppercase tracking-widest font-mono text-center text-lg"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoFocus
              />
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
