import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSharedWorksheet } from '../utils/firestoreService'
import { FileDown, Printer, ExternalLink } from 'lucide-react'
import { downloadAsPdfFromHtml, printWorksheetHtml } from '../utils/worksheetGenerator'
import { useLang } from '../contexts/LanguageContext'
import { errorText } from '../utils/appError'

export default function SharedViewPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { t } = useLang()
  const [worksheet, setWorksheet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    // Reset when the token changes so a previous link's result doesn't stick
    // and a slow response for an old token can't overwrite the current one
    let stale = false
    setLoading(true); setNotFound(false); setWorksheet(null)
    getSharedWorksheet(token)
      .then((doc) => {
        if (stale) return
        if (!doc || !doc.worksheetHtml) { setNotFound(true); return }
        setWorksheet(doc)
      })
      .catch(() => { if (!stale) setNotFound(true) })
      .finally(() => { if (!stale) setLoading(false) })
    return () => { stale = true }
  }, [token])

  const handlePdf = async () => {
    if (!worksheet || busy) return
    setBusy('pdf')
    try {
      await downloadAsPdfFromHtml(worksheet.worksheetHtml, worksheet.name || 'worksheet')
    } catch (err) {
      alert(t('pdfFailed') + ': ' + errorText(err, t))
    } finally {
      setBusy(null)
    }
  }

  const handlePrint = () => {
    if (!worksheet) return
    try {
      printWorksheetHtml(worksheet.worksheetHtml)
    } catch (err) {
      alert(t('printFailed') + ': ' + errorText(err, t))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4 p-6 text-center">
        <span className="text-5xl inline-flex w-20 h-20 items-center justify-center bg-white dark:bg-slate-900 rounded-3xl shadow-lg ring-1 ring-black/5 dark:ring-white/10">🔍</span>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{t('worksheetNotFound')}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">
          {t('shareLinkExpired')}
        </p>
        <button onClick={() => navigate('/')} className="btn-primary text-sm mt-2">
          {t('goToApp')}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">
      {/* Header bar */}
      <div className="bg-slate-900/95 dark:bg-slate-950/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-10 px-4 py-3 flex items-center justify-between gap-3 shadow-md safe-top">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg w-9 h-9 flex-shrink-0 inline-flex items-center justify-center bg-white/5 ring-1 ring-white/10 rounded-xl">🌉</span>
          <div className="min-w-0">
            <p className="font-semibold tracking-tight text-white text-sm truncate">{worksheet.name}</p>
            <p className="text-white/50 text-xs">{t('sharedVia')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handlePdf}
            disabled={!!busy}
            className="flex items-center gap-1.5 text-xs font-semibold bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            <FileDown size={13} /> PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-semibold bg-white/5 hover:bg-white/15 text-white px-3 py-1.5 rounded-lg transition-colors ring-1 ring-white/10"
          >
            <Printer size={13} /> {t('print')}
          </button>
          <button
            onClick={() => navigate('/')}
            className="p-1.5 bg-white/5 hover:bg-white/15 ring-1 ring-white/10 rounded-lg transition-colors"
            title={t('openApp')}
          >
            <ExternalLink size={15} className="text-white" />
          </button>
        </div>
      </div>

      {/* Worksheet iframe */}
      <iframe
        srcDoc={worksheet.worksheetHtml}
        sandbox="allow-scripts"
        className="flex-1 w-full bg-white border-0 sm:w-[calc(100%-3rem)] sm:max-w-4xl sm:mx-auto sm:my-6 sm:rounded-2xl sm:shadow-xl sm:ring-1 sm:ring-black/5"
        title={t('sharedWorksheet')}
        style={{ minHeight: '80vh' }}
      />

      {/* Footer CTA */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/80 dark:border-white/10 px-4 py-3 flex items-center justify-between gap-3 safe-bottom">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('poweredBy').split('{app}').map((part, i) => i === 0 ? part : (
            <span key={i}><span className="font-semibold text-violet-600 dark:text-violet-400">Doc Translate</span>{part}</span>
          ))}
        </p>
        <button
          onClick={() => navigate('/')}
          className="btn-primary text-xs py-2"
        >
          {t('tryFree')}
        </button>
      </div>
    </div>
  )
}
