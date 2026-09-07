import { useState, useRef, useEffect } from 'react'
import { FileText, MoreVertical, Download, Printer, Trash2, Eye, FolderInput } from 'lucide-react'
import { useLang } from '../contexts/LanguageContext'

export default function WorksheetCard({
  worksheet, onClick, onDelete, onPrint, onDocx, onPdf, onMoveTo,
  onDragStart, onDragEnd,
  onTouchDragStart, onTouchDragMove, onTouchDragEnd,
}) {
  const { t, langCode } = useLang()
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [dragging,  setDragging]  = useState(false)
  const menuRef  = useRef(null)
  const cardRef  = useRef(null)
  const touchDragging = useRef(false)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Prevent page scroll during touch drag (must be non-passive) ───────────
  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const handleTouchMove = (e) => {
      if (!touchDragging.current) return
      e.preventDefault()
      const touch = e.touches[0]
      onTouchDragMove?.(worksheet.id, touch.clientX, touch.clientY)
    }
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    return () => el.removeEventListener('touchmove', handleTouchMove)
  }, [worksheet.id, onTouchDragMove])

  const { name, originalFileType, createdAt } = worksheet
  const locale = langCode === 'ja' ? 'ja-JP' : langCode === 'zh-CN' ? 'zh-CN' : langCode === 'ko' ? 'ko-KR' : 'en-US'
  const date = createdAt?.toDate?.()?.toLocaleDateString(locale) || '—'
  const isPdf = originalFileType === 'pdf'

  // ── Mouse drag (desktop) ──────────────────────────────────────────────────
  const handleDragStart = (e) => {
    setDragging(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('worksheetId', worksheet.id)
    onDragStart?.()
  }
  const handleDragEnd = () => { setDragging(false); onDragEnd?.() }

  // ── Touch drag (mobile) ───────────────────────────────────────────────────
  const handleTouchStart = (e) => {
    // Only start drag if not tapping the menu button
    if (e.target.closest('[data-menu]')) return
    touchDragging.current = true
    setDragging(true)
    const touch = e.touches[0]
    onTouchDragStart?.(worksheet.id, touch.clientX, touch.clientY)
  }

  const handleTouchEnd = (e) => {
    if (!touchDragging.current) return
    touchDragging.current = false
    setDragging(false)
    const touch = e.changedTouches[0]
    onTouchDragEnd?.(worksheet.id, touch.clientX, touch.clientY)
  }

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
        dragging ? 'opacity-40 scale-95 shadow-none' : ''
      }`}
      onClick={dragging ? undefined : onClick}
    >
      {/* Coloured accent stripe */}
      <div className={`h-1.5 w-full rounded-t-2xl ${isPdf ? 'bg-gradient-to-r from-rose-400 to-pink-500' : 'bg-gradient-to-r from-blue-400 to-violet-500'}`} />

      <div className="p-4 flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isPdf ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-500' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-500'
        }`}>
          <FileText size={20} strokeWidth={1.8} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm line-clamp-2 leading-snug">{name}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isPdf
                ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
                : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
            }`}>{isPdf ? 'PDF' : 'DOCX'}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{date}</span>
          </div>
        </div>

        {/* Context menu */}
        <div data-menu ref={menuRef} className="flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            <MoreVertical size={14} className="text-slate-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-2 top-12 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50 min-w-[170px]">
              <button
                onClick={() => { onClick(); setMenuOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Eye size={13} className="text-violet-500" /> {t('open')}
              </button>
              <button
                onClick={() => { onPdf?.(); setMenuOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Download size={13} className="text-rose-500" /> {t('downloadPdf')}
              </button>
              <button
                onClick={() => { onDocx?.(); setMenuOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Download size={13} className="text-blue-500" /> {t('downloadWord')}
              </button>
              <button
                onClick={() => { onPrint?.(); setMenuOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Printer size={13} className="text-emerald-500" /> {t('print')}
              </button>
              <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
              <button
                onClick={() => { onMoveTo?.(); setMenuOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <FolderInput size={13} className="text-violet-500" /> Move to…
              </button>
              <button
                onClick={() => { onDelete(); setMenuOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30"
              >
                <Trash2 size={13} /> {t('delete')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
