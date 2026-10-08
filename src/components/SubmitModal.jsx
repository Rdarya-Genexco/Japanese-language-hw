import { useState, useEffect } from 'react'
import { X, Send, CheckCircle, AlertCircle } from 'lucide-react'
import {
  submitToClassroom, submitToAssignment, getClassroom, getAssignments, getAllWorksheets, getWorksheet,
  getMyAssignmentSubmissions,
} from '../utils/firestoreService'
import { hydrateWorksheetHtml } from '../utils/worksheetGenerator'
import { dueStatus, overdueText } from '../utils/dueDates'
import { useLang } from '../contexts/LanguageContext'
import { errorText } from '../utils/appError'
import { useAuth } from '../contexts/AuthContext'
import { useRole } from '../contexts/RoleContext'

/**
 * Opened from a worksheet (worksheetHtml + name given) or from an assignment (assignment given,
 * attaching a worksheet optional). A submission needs a worksheet, feedback, or both.
 */
export default function SubmitModal({ worksheetHtml, name, assignment = null, onSubmitted, onClose }) {
  const { user } = useAuth()
  const { t, formatDate } = useLang()
  const { classroomCode: savedCode } = useRole()
  const hasWorksheet = !!worksheetHtml

  const [code, setCode] = useState(savedCode || '')
  const [assignments, setAssignments] = useState([])
  const [selectedAssignment, setSelectedAssignment] = useState(assignment)
  const [alreadySubmitted, setAlreadySubmitted] = useState(new Set())
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
      .then(async list => {
        setAssignments(list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
        const done = await Promise.all(list.map(a =>
          getMyAssignmentSubmissions(savedCode, a.id, user.uid).then(s => s.length > 0 ? a.id : null).catch(() => null)))
        setAlreadySubmitted(new Set(done.filter(Boolean)))
      })
      .catch(() => {})
      .finally(() => setLoadingAssignments(false))
  }, [savedCode, assignment, user.uid])

  const trimmedFeedback = feedback.trim()
  const selectedStatus = selectedAssignment ? dueStatus(selectedAssignment) : { state: 'none' }
  const canSubmit = !!code.trim() && (hasWorksheet || !!attachId || !!trimmedFeedback) && selectedStatus.state !== 'closed'

  const handleSubmit = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) { setError(t('enterClassCode')); return }
    if (selectedStatus.state === 'closed') { setError(t('assignmentClosed')); return }
    if (!canSubmit) { setError(t('attachOrFeedback')); return }
    setSubmitting(true); setError('')
    try {
      const classroom = await getClassroom(trimmed)
      if (!classroom) { setError(t('classroomNotFoundCheck')); return }

      let wsName = name || ''
      let wsHtml = worksheetHtml || ''
      if (!hasWorksheet && attachId) {
        const full = await getWorksheet(user.uid, attachId)
        if (!full.worksheetHtml) { setError(t('oldFormatWorksheet')); return }
        wsName = full.name
        wsHtml = hydrateWorksheetHtml(full.worksheetHtml, full.originalImageUri)
      }

      const args = [user.uid, user.displayName || '', wsName, wsHtml, trimmedFeedback]
      if (selectedAssignment) {
        await submitToAssignment(trimmed, selectedAssignment.id, ...args)
        onSubmitted?.(selectedAssignment.id)
      } else {
        await submitToClassroom(trimmed, ...args)
      }
      setDone(true)
    } catch (err) {
      setError(t('submissionFailed') + ': ' + errorText(err, t))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 w-full max-w-sm overflow-hidden">
        <div className="bg-slate-900 dark:bg-slate-950 border-b-2 border-violet-500 px-5 pt-5 pb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white">{t('submitToTeacher')}</h2>
            <p className="text-white/70 text-xs mt-0.5 truncate max-w-[200px]">
              {hasWorksheet ? `"${name}"` : assignment ? assignment.title : t('feedbackOrWorksheet')}
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
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">{t('submittedTitle')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {t('sentToTeacher')}{' '}
                {selectedAssignment && <span className="font-medium">{t('assignmentLabel', { title: selectedAssignment.title })}</span>}
              </p>
              <button onClick={onClose} className="btn-primary justify-center w-full text-sm">
                {t('doneButton')}
              </button>
            </div>
          ) : (
            <>
              {/* Classroom code field */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  {t('classroomCode')}
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
                  placeholder={t('codePlaceholder')}
                  maxLength={10}
                  className="input w-full uppercase tracking-widest font-mono text-center text-lg"
                  readOnly={!!savedCode}
                />
                {savedCode && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 text-center">{t('savedClassroom')}</p>
                )}
              </div>

              {/* Assignment picker */}
              {assignment ? (
                <div className="mb-4 px-3 py-2 rounded-xl border border-violet-400 bg-violet-50 dark:bg-violet-900/20 text-xs text-violet-700 dark:text-violet-300">
                  <div className="font-semibold">{assignment.title}</div>
                  {assignment.dueDate && <div className="text-slate-400 mt-0.5">{t('dueOn', { date: formatDate(assignment.dueDate) })}</div>}
                  <DueWarning status={selectedStatus} />
                </div>
              ) : loadingAssignments ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                  <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                  {t('loadingAssignments')}
                </div>
              ) : assignments.length > 0 && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    {t('assignmentOptional')}
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    <button
                      onClick={() => setSelectedAssignment(null)}
                      className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-colors ${
                        !selectedAssignment
                          ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                          : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {t('generalSubmission')}
                    </button>
                    {assignments.map(a => {
                      const status = dueStatus(a)
                      const submittedAlready = alreadySubmitted.has(a.id)
                      const unavailable = submittedAlready || status.state === 'closed'
                      return (
                        <button
                          key={a.id}
                          onClick={() => !unavailable && setSelectedAssignment(a)}
                          disabled={unavailable}
                          className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            selectedAssignment?.id === a.id
                              ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                              : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                          }`}
                        >
                          <div className="font-semibold">{a.title}{submittedAlready ? ' · ' + t('submittedCheck') : ''}</div>
                          {a.dueDate && <div className="text-slate-400 mt-0.5">{t('dueOn', { date: formatDate(a.dueDate) })}</div>}
                          {!submittedAlready && <DueWarning status={status} />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {!hasWorksheet && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    {t('attachWorksheetOptional')}
                  </label>
                  <select
                    value={attachId}
                    onChange={e => { setAttachId(e.target.value); setError('') }}
                    className="input w-full text-sm"
                  >
                    <option value="">{t('noWorksheet')}</option>
                    {myWorksheets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  {t('feedback')} {hasWorksheet || attachId ? t('optionalSuffix') : ''}
                </label>
                <textarea
                  value={feedback}
                  onChange={e => { setFeedback(e.target.value); setError('') }}
                  placeholder={t('feedbackPlaceholder')}
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
                  {t('cancel')}
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
                  {t('submit')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function DueWarning({ status }) {
  const { t } = useLang()
  const text = overdueText(status, t)
  if (!text) return null
  return (
    <div className={`mt-1 font-semibold ${status.state === 'closed' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
      ⚠️ {text}
    </div>
  )
}
