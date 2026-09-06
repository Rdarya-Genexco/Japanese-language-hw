import { useRef } from 'react'
import { X, Printer, FileDown, Trash2 } from 'lucide-react'
import { openPrintView, downloadAsDocx, downloadAsPdf, downloadAsPdfFromHtml, downloadAsDocxFromHtml } from '../utils/worksheetGenerator'
import { useLang } from '../contexts/LanguageContext'

export default function WorksheetViewer({ worksheet, onClose, onDelete }) {
  const { t, langCode } = useLang()
  const iframeRef = useRef(null)

  const { name, worksheetData, worksheetHtml, createdAt } = worksheet
  const isHtml = !!worksheetHtml

  // For legacy JSON worksheets — pull display fields from worksheetData
  const { title, titleEn, subject, subjectEn, grade, instructions, instructionsEn, sections = [] } = worksheetData || {}

  const date = createdAt?.toDate?.()?.toLocaleDateString(
    langCode === 'ja' ? 'ja-JP' : langCode === 'zh-CN' ? 'zh-CN' : langCode === 'ko' ? 'ko-KR' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  ) || '—'

  // ── Actions ───────────────────────────────────────────────────────────────

  function handlePrint() {
    if (isHtml) {
      const win = window.open('', '_blank')
      win.document.write(worksheetHtml)
      win.document.close()
      win.focus()
      setTimeout(() => win.print(), 600)
    } else {
      openPrintView(worksheetData)
    }
  }

  function handlePdf() {
    if (isHtml) {
      downloadAsPdfFromHtml(worksheetHtml, (name || 'worksheet').replace(/\.[^.]+$/, ''))
    } else {
      downloadAsPdf(worksheetData)
    }
  }

  function handleDocx() {
    if (isHtml) {
      downloadAsDocxFromHtml(worksheetHtml, (name || 'worksheet').replace(/\.[^.]+$/, ''))
    } else {
      downloadAsDocx(worksheetData)
    }
  }

  // ── Display name for header ────────────────────────────────────────────────
  const displayTitle = isHtml ? name : (title || name)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Gradient header */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 px-5 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <h2 className="font-bold text-white text-lg leading-tight">{displayTitle}</h2>
              {!isHtml && titleEn && <p className="text-xs text-white/70 italic mt-0.5">{titleEn}</p>}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {!isHtml && subject && (
                  <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium border border-white/20">
                    {subject}{subjectEn ? ` / ${subjectEn}` : ''}
                  </span>
                )}
                {!isHtml && grade && (
                  <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/20">{grade}</span>
                )}
                <span className="text-xs text-white/60">{date}</span>
                {isHtml && (
                  <span className="text-xs bg-emerald-400/30 text-white px-2 py-0.5 rounded-full border border-emerald-300/30 font-medium">
                    ✨ AI formatted
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg flex-shrink-0 transition-colors">
              <X size={18} className="text-white" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handlePdf}
              className="flex items-center gap-1.5 text-xs font-semibold bg-white text-violet-700 hover:bg-violet-50 px-3 py-1.5 rounded-lg transition-colors flex-1 justify-center shadow-sm"
            >
              <FileDown size={13} /> PDF
            </button>
            <button
              onClick={handleDocx}
              className="flex items-center gap-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg transition-colors flex-1 justify-center border border-white/20"
            >
              <FileDown size={13} /> Word
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg transition-colors flex-1 justify-center border border-white/20"
            >
              <Printer size={13} /> {t('print')}
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 text-xs font-semibold bg-rose-500/80 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg transition-colors border border-rose-400/30"
              title={t('delete')}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Content area */}
        {isHtml ? (
          // ── New: render Gemini-generated HTML in a sandboxed iframe ─────────
          <iframe
            ref={iframeRef}
            srcDoc={worksheetHtml}
            sandbox="allow-same-origin allow-scripts"
            className="flex-1 w-full bg-white border-0"
            title="Worksheet"
            style={{ minHeight: 0 }}
          />
        ) : (
          // ── Legacy: JSON-based renderer ──────────────────────────────────────
          <>
            <div className="overflow-y-auto flex-1 px-5 py-4 bg-white">
              {instructions && (
                <div className="bg-indigo-50 border-l-4 border-indigo-400 rounded-r-xl p-3 mb-4 text-sm text-indigo-800">
                  <strong>{t('instructions')}：</strong> {instructions}
                  {instructionsEn && <p className="text-xs text-indigo-500 italic mt-1">{instructionsEn}</p>}
                </div>
              )}

              {sections.map((section, si) => (
                <div key={si} className="mb-6">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="w-6 h-6 bg-gradient-to-br from-blue-500 to-violet-600 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      {si + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800">{section.sectionTitle}</h3>
                      {section.sectionTitleEn && <p className="text-xs text-slate-400 italic">{section.sectionTitleEn}</p>}
                    </div>
                    {section.points && (
                      <span className="text-xs bg-gradient-to-r from-blue-100 to-violet-100 text-violet-700 px-2 py-0.5 rounded-full ml-auto font-bold flex-shrink-0 border border-violet-200">
                        {section.points}{t('pts')}
                      </span>
                    )}
                  </div>

                  {section.instructions && (
                    <div className="text-xs text-slate-500 italic mb-2 ml-8">
                      {section.instructions}
                      {section.instructionsEn && <span className="text-slate-400"> / {section.instructionsEn}</span>}
                    </div>
                  )}

                  <div className="ml-8 space-y-2">
                    {(section.questions || []).map((q, qi) => (
                      <QuestionPreview key={qi} q={q} type={section.type} index={qi} />
                    ))}
                  </div>
                </div>
              ))}

              {sections.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-8">{t('noPreview')}</p>
              )}
            </div>

            {/* Tip */}
            <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 flex-shrink-0">
              <p className="text-xs text-amber-700">💡 {t('tipText')}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Legacy JSON question renderer ─────────────────────────────────────────────

function QuestionPreview({ q, type, index }) {
  const num = q.id ?? index + 1

  switch (type) {
    case 'multiple_choice':
      return (
        <div className="text-sm bg-white">
          <p className="text-slate-700 font-medium">{num}. {q.text}</p>
          {q.textEn && <p className="text-xs text-slate-400 italic ml-4 mt-0.5">{q.textEn}</p>}
          <div className="mt-1.5 ml-2 space-y-0.5">
            {(q.options || []).map((opt, i) => (
              <div key={i} className="text-xs px-2 py-1 text-slate-600 bg-white">
                {opt}
                {q.optionsEn?.[i] && <p className="text-slate-400 italic font-normal mt-0.5">{q.optionsEn[i]}</p>}
              </div>
            ))}
          </div>
        </div>
      )

    case 'true_false':
      return (
        <div className="text-sm bg-white">
          <div className="flex items-start gap-2">
            <span className="text-slate-500 font-mono flex-shrink-0">{num}.</span>
            <div className="flex-1">
              <span className="text-slate-700">{q.text}</span>
              {q.textEn && <p className="text-xs text-slate-400 italic mt-0.5">{q.textEn}</p>}
              <div className="flex gap-3 mt-1.5">
                <span className="text-xs border border-slate-300 rounded px-3 py-0.5 text-slate-500 bg-white">○</span>
                <span className="text-xs border border-slate-300 rounded px-3 py-0.5 text-slate-500 bg-white">×</span>
              </div>
            </div>
          </div>
        </div>
      )

    case 'matching':
      return (
        <div className="text-sm grid grid-cols-[1fr_auto] gap-0 border border-slate-200 rounded overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-r border-b border-slate-200">
            <span className="font-semibold text-slate-800">{num}. {q.left}</span>
            {q.leftEn && <p className="text-xs text-slate-400 italic mt-0.5">{q.leftEn}</p>}
          </div>
          <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center">
            <span className="inline-block border-b border-slate-400 w-10">&nbsp;</span>
          </div>
        </div>
      )

    default:
      return (
        <div className="text-sm text-slate-700 bg-white">
          <span className="text-slate-500 font-mono">{num}.</span>{' '}
          <span style={{ whiteSpace: 'pre-wrap' }}>{q.text || JSON.stringify(q)}</span>
          {q.textEn && <p className="text-xs text-slate-400 italic ml-5 mt-0.5" style={{ whiteSpace: 'pre-wrap' }}>{q.textEn}</p>}
          {(type === 'short_answer' || type === 'essay') && (
            <div className="mt-2 ml-5 space-y-2">
              {Array.from({ length: q.lines || 3 }, (_, i) => (
                <div key={i} className="border-b border-slate-300 h-5" />
              ))}
            </div>
          )}
        </div>
      )
  }
}
