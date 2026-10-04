import { useState, useEffect } from 'react'
import { X, Plus, Loader2, Paperclip, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { createAssignment, getAllWorksheets, getWorksheet } from '../utils/firestoreService'
import { useAuth } from '../contexts/AuthContext'
import { hydrateWorksheetHtml } from '../utils/worksheetGenerator'
import { useLang } from '../contexts/LanguageContext'
import { errorText } from '../utils/appError'

export default function AssignmentModal({ classroomCode, onClose, onCreated }) {
  const { user } = useAuth()
  const { t } = useLang()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Worksheet picker
  const [pickerOpen, setPickerOpen] = useState(false)
  const [worksheets, setWorksheets] = useState([])
  const [loadingWs, setLoadingWs] = useState(false)
  const [selectedWs, setSelectedWs] = useState(null) // { id, name }

  useEffect(() => {
    if (!pickerOpen || worksheets.length > 0) return
    setLoadingWs(true)
    getAllWorksheets(user.uid)
      .then(setWorksheets)
      .finally(() => setLoadingWs(false))
  }, [pickerOpen, user.uid, worksheets.length])

  const handleCreate = async () => {
    if (!title.trim()) { setError(t('enterTitle')); return }
    setSaving(true); setError('')
    try {
      let attachedWorksheet = null
      if (selectedWs) {
        const full = await getWorksheet(user.uid, selectedWs.id)
        attachedWorksheet = { name: full.name, worksheetHtml: hydrateWorksheetHtml(full.worksheetHtml || '', full.originalImageUri) }
      }
      const id = await createAssignment(
        classroomCode,
        user.uid,
        title.trim(),
        description.trim(),
        dueDate || null,
        attachedWorksheet,
      )
      onCreated?.({ id, title: title.trim(), description: description.trim(), dueDate: dueDate || null,
        attachedWorksheetName: attachedWorksheet?.name || null })
      onClose()
    } catch (err) {
      setError(t('failedCreateAssignment') + ': ' + errorText(err, t))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 pt-5 pb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white">{t('newAssignment')}</h2>
            <p className="text-white/70 text-xs mt-0.5">{t('postToClassroom', { code: classroomCode })}</p>
          </div>
          <button onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            <X size={15} className="text-white" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{t('titleRequired')}</label>
            <input
              type="text"
              value={title}
              onChange={e => { setTitle(e.target.value); setError('') }}
              placeholder={t('titlePlaceholder')}
              className="input w-full"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{t('description')}</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('descriptionPlaceholder')}
              rows={2}
              className="input w-full resize-none"
            />
          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{t('dueDateOptional')}</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="input w-full"
            />
          </div>

          {/* Attach worksheet */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setPickerOpen(v => !v)}
              className="w-full flex items-center gap-2 px-3.5 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <Paperclip size={14} className="text-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {t('attachWorksheet')}
                </span>
                {selectedWs && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 truncate mt-0.5">{selectedWs.name}</p>
                )}
                {!selectedWs && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">{t('pickWorksheet')}</p>
                )}
              </div>
              {pickerOpen ? <ChevronUp size={13} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={13} className="text-slate-400 flex-shrink-0" />}
            </button>

            {pickerOpen && (
              <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 max-h-44 overflow-y-auto">
                {loadingWs ? (
                  <div className="flex items-center gap-2 justify-center py-4 text-slate-400 text-xs">
                    <Loader2 size={13} className="animate-spin" /> {t('loadingWorksheets')}
                  </div>
                ) : worksheets.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">{t('noWorksheetsUploadFirst')}</p>
                ) : (
                  <>
                    {/* None option */}
                    <button
                      type="button"
                      onClick={() => { setSelectedWs(null); setPickerOpen(false) }}
                      className={`w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 transition-colors ${
                        !selectedWs ? 'bg-slate-200 dark:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {!selectedWs && <Check size={11} />} {t('noAttachment')}
                    </button>
                    {worksheets.map(ws => (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => { setSelectedWs(ws); setPickerOpen(false) }}
                        className={`w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 transition-colors border-t border-slate-200 dark:border-slate-700 ${
                          selectedWs?.id === ws.id
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {selectedWs?.id === ws.id && <Check size={11} className="flex-shrink-0" />}
                        <span className="truncate">{ws.name}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-rose-500">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center text-sm">
              {t('cancel')}
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !title.trim()}
              className="btn-primary flex-1 justify-center text-sm"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {saving ? t('creating') : t('create')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
