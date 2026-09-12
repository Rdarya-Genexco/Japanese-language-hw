import { useState, useRef, useCallback } from 'react'
import { X, Upload, FileText, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'
import { parseFile } from '../utils/fileParser'
import { processWorksheetWithGemini } from '../utils/gemini'
import { saveWorksheet } from '../utils/firestoreService'
import { useLang } from '../contexts/LanguageContext'

const STEP_COLORS = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500']
const ACCEPTED_TYPES = ['.pdf', '.doc', '.docx', '.pptx', '.png', '.jpg', '.jpeg']
const ACCEPTED_EXTS  = ['pdf', 'doc', 'docx', 'pptx', 'png', 'jpg', 'jpeg']

export default function UploadModal({ uid, folderId, onClose, onComplete }) {
  const { langCode, lang, t } = useLang()
  const [file,        setFile]        = useState(null)
  const [dragging,    setDragging]    = useState(false)
  const [processing,  setProcessing]  = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [error,       setError]       = useState('')
  const [done,        setDone]        = useState(false)
  const fileInputRef = useRef(null)

  const STEPS = [
    { id: 'read', label: t('readingFile'), color: 'text-blue-600 dark:text-blue-400' },
    { id: 'ai',   label: t('aiProcessing'), color: 'text-violet-600 dark:text-violet-400' },
    { id: 'save', label: t('saving'),       color: 'text-emerald-600 dark:text-emerald-400' },
    { id: 'done', label: t('done'),         color: 'text-emerald-600 dark:text-emerald-400' },
  ]

  const handleFile = (f) => {
    const ext = f.name.split('.').pop().toLowerCase()
    if (!ACCEPTED_EXTS.includes(ext)) {
      setError(t('wrongFile'))
      return
    }
    if (f.size > 20 * 1024 * 1024) {
      setError(t('tooBig'))
      return
    }
    setError('')
    setFile(f)
  }

  const onDrop      = useCallback((e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }, [langCode])
  const onDragOver  = useCallback((e) => { e.preventDefault(); setDragging(true) }, [])
  const onDragLeave = useCallback(() => setDragging(false), [])

  const handleProcess = async () => {
    if (!file) return
    setProcessing(true); setError(''); setCurrentStep(0)
    try {
      const { data, mimeType } = await parseFile(file)
      setCurrentStep(1)
      const apiKey = ''
      const worksheetData = await processWorksheetWithGemini(data, mimeType, apiKey, langCode)
      // worksheetData is an HTML string (new pipeline) or a plain object (legacy)
      if (worksheetData && typeof worksheetData === 'object') {
        worksheetData.language = worksheetData.language || langCode
      }
      setCurrentStep(2)
      await saveWorksheet(uid, folderId, file, worksheetData)
      setCurrentStep(3); setDone(true)
    } catch (err) {
      console.error(err)
      setError(err.message || 'An error occurred. Please try again.')
      setProcessing(false); setCurrentStep(-1); setDone(false)
    }
  }

  const ext  = file?.name?.split('.').pop().toLowerCase()
  const isImg = ext === 'png' || ext === 'jpg' || ext === 'jpeg'
  const isProcessing = processing && !done

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Gradient header */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 px-6 pt-5 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-white" />
            <h2 className="font-bold text-white">{t('upload')}</h2>
          </div>
          {!isProcessing && (
            <button onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
              <X size={15} className="text-white" />
            </button>
          )}
        </div>

        <div className="px-6 pb-6 pt-5">
          {!processing ? (
            <>
              {/* Language indicator */}
              <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-xl">
                <span className="text-xl">{lang.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">{lang.native}</p>
                  <p className="text-xs text-violet-500 dark:text-violet-400 truncate">{lang.name}</p>
                </div>
                <span className="text-xs text-violet-400 dark:text-violet-500">{t('selected')}</span>
              </div>

              {/* Drop zone */}
              <div
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                  dragging
                    ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20'
                    : file
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-violet-300 dark:hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-900/10'
                }`}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => !file && fileInputRef.current?.click()}
              >
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      ext === 'pdf'    ? 'bg-rose-100 dark:bg-rose-900/30'
                      : ext === 'pptx' ? 'bg-orange-100 dark:bg-orange-900/30'
                      : isImg          ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      <FileText className={
                        ext === 'pdf'    ? 'text-rose-500'
                        : ext === 'pptx' ? 'text-orange-500'
                        : isImg          ? 'text-emerald-500'
                        : 'text-blue-500'
                      } size={24} strokeWidth={1.5} />
                    </div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{file.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); setError('') }}
                      className="text-xs text-rose-500 dark:text-rose-400 hover:underline mt-1 font-medium"
                    >
                      {t('changeFile')}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 rounded-2xl flex items-center justify-center shadow-inner">
                      <Upload size={26} className="text-violet-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{t('dropFile')}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {t('orBrowse')}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">PDF · DOCX · PPTX · PNG · JPG · max 20 MB</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES.join(',')} className="hidden"
                  onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
              </div>

              {error && (
                <div className="mt-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="text-rose-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
                  </div>
                  {file && (
                    <button
                      onClick={handleProcess}
                      className="mt-2 w-full text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-lg px-3 py-1.5 transition-colors"
                    >
                      ↺ {t('retry') || 'Retry'}
                    </button>
                  )}
                </div>
              )}

              <div className="mt-4 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-xl p-3.5 border border-indigo-100 dark:border-indigo-800">
                <p className="font-semibold text-indigo-700 dark:text-indigo-300 mb-1 text-sm">🤖 AI</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400">{t('aiDesc')}</p>
              </div>

              <div className="flex gap-2 mt-4">
                <button onClick={onClose} className="btn-secondary flex-1 justify-center text-sm">
                  {t('cancel')}
                </button>
                <button onClick={handleProcess} disabled={!file} className="btn-primary flex-1 justify-center text-sm">
                  <Sparkles size={15} /> {t('convert')} → {lang.native}
                </button>
              </div>
            </>
          ) : (
            <div className="py-4">
              {!done ? (
                <>
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full border-4 border-violet-100 dark:border-violet-900 border-t-violet-600 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl">🤖</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {STEPS.slice(0, 3).map((step, i) => (
                      <div key={step.id} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          i < currentStep  ? 'bg-emerald-500' :
                          i === currentStep ? `${STEP_COLORS[i]} animate-pulse` :
                          'bg-slate-200 dark:bg-slate-700'
                        }`}>
                          {i < currentStep ? (
                            <CheckCircle size={14} className="text-white" />
                          ) : i === currentStep ? (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          ) : null}
                        </div>
                        <span className={`text-sm transition-colors font-medium ${
                          i === currentStep ? step.color :
                          i < currentStep   ? 'text-emerald-600 dark:text-emerald-400' :
                          'text-slate-400 dark:text-slate-500'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-5">{t('convertTime')}</p>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <CheckCircle size={40} className="text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">{t('successTitle')}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{t('successDesc')}</p>
                  <button onClick={onComplete} className="btn-primary w-full justify-center">
                    {t('viewWorksheet')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
