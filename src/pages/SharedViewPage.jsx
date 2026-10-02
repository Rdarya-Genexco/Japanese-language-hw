import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSharedWorksheet } from '../utils/firestoreService'
import { FileDown, Printer, ExternalLink } from 'lucide-react'
import { downloadAsPdfFromHtml, printWorksheetHtml } from '../utils/worksheetGenerator'

export default function SharedViewPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [worksheet, setWorksheet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    getSharedWorksheet(token)
      .then((doc) => {
        if (!doc || !doc.worksheetHtml) { setNotFound(true); return }
        setWorksheet(doc)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [token])

  const handlePdf = async () => {
    if (!worksheet || busy) return
    setBusy('pdf')
    try {
      await downloadAsPdfFromHtml(worksheet.worksheetHtml, worksheet.name || 'worksheet')
    } catch (err) {
      alert('PDF download failed: ' + err.message)
    } finally {
      setBusy(null)
    }
  }

  const handlePrint = () => {
    if (!worksheet) return
    printWorksheetHtml(worksheet.worksheetHtml)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 gap-4 p-6 text-center">
        <span className="text-5xl">🔍</span>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Worksheet not found</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">
          This share link may have expired or been removed.
        </p>
        <button onClick={() => navigate('/')} className="btn-primary text-sm mt-2">
          Go to Doc Translate
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">🌉</span>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm truncate">{worksheet.name}</p>
            <p className="text-white/60 text-xs">Shared via Doc Translate</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handlePdf}
            disabled={!!busy}
            className="flex items-center gap-1.5 text-xs font-semibold bg-white text-violet-700 hover:bg-violet-50 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            <FileDown size={13} /> PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg transition-colors border border-white/20"
          >
            <Printer size={13} /> Print
          </button>
          <button
            onClick={() => navigate('/')}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            title="Open Doc Translate"
          >
            <ExternalLink size={15} className="text-white" />
          </button>
        </div>
      </div>

      {/* Worksheet iframe */}
      <iframe
        srcDoc={worksheet.worksheetHtml}
        sandbox="allow-scripts"
        className="flex-1 w-full bg-white border-0"
        title="Shared Worksheet"
        style={{ minHeight: '80vh' }}
      />

      {/* Footer CTA */}
      <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Powered by <span className="font-semibold text-violet-600 dark:text-violet-400">Doc Translate</span> — AI worksheet translator
        </p>
        <button
          onClick={() => navigate('/')}
          className="btn-primary text-xs py-1.5"
        >
          Try for free
        </button>
      </div>
    </div>
  )
}
