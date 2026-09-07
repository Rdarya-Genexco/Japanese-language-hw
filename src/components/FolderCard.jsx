import { useState, useRef, useEffect } from 'react'
import { Folder, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useLang } from '../contexts/LanguageContext'

// Deterministic colour per folder id
const PALETTES = [
  { card: 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/30 border-blue-200 dark:border-blue-700',   icon: 'text-blue-500',   menu: 'hover:bg-blue-50 dark:hover:bg-blue-900/30' },
  { card: 'bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/30 border-violet-200 dark:border-violet-700', icon: 'text-violet-500', menu: 'hover:bg-violet-50 dark:hover:bg-violet-900/30' },
  { card: 'bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-900/40 dark:to-pink-900/30 border-rose-200 dark:border-rose-700',       icon: 'text-rose-500',   menu: 'hover:bg-rose-50 dark:hover:bg-rose-900/30' },
  { card: 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/40 dark:to-green-900/30 border-emerald-200 dark:border-emerald-700', icon: 'text-emerald-500', menu: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/30' },
  { card: 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/30 border-amber-200 dark:border-amber-700', icon: 'text-amber-500',  menu: 'hover:bg-amber-50 dark:hover:bg-amber-900/30' },
  { card: 'bg-gradient-to-br from-cyan-50 to-sky-100 dark:from-cyan-900/40 dark:to-sky-900/30 border-cyan-200 dark:border-cyan-700',         icon: 'text-cyan-500',   menu: 'hover:bg-cyan-50 dark:hover:bg-cyan-900/30' },
]

function palette(id = '') {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return PALETTES[h % PALETTES.length]
}

export default function FolderCard({ folder, onClick, onDelete, onRename, isDragTarget, onDropWorksheet }) {
  const { t } = useLang()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const menuRef = useRef(null)
  const p = palette(folder.id)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleDragOver = (e) => {
    if (!isDragTarget) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const worksheetId = e.dataTransfer.getData('worksheetId')
    if (worksheetId) onDropWorksheet?.(worksheetId, folder.id)
  }

  return (
    <div
      className={`group relative rounded-2xl border hover:shadow-lg transition-all duration-200 cursor-pointer p-4 flex flex-col items-center text-center gap-2 hover:-translate-y-0.5 ${p.card} ${
        dragOver ? 'ring-2 ring-violet-400 ring-offset-2 scale-105 shadow-xl brightness-95' : ''
      }`}
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop hint */}
      {dragOver && (
        <div className="absolute inset-0 rounded-2xl bg-violet-400/10 flex items-center justify-center pointer-events-none z-10">
          <span className="text-xs font-bold text-violet-600 dark:text-violet-300 bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded-lg shadow">
            Move here
          </span>
        </div>
      )}

      {/* Folder icon */}
      <div className="relative mt-1">
        <Folder className={`w-12 h-12 ${p.icon} transition-transform ${dragOver ? 'scale-110' : ''}`} fill="currentColor" fillOpacity={0.25} strokeWidth={1.5} />
      </div>

      {/* Name */}
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 line-clamp-2 w-full leading-snug">{folder.name}</p>

      {/* Context menu */}
      <div ref={menuRef} className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm"
        >
          <MoreVertical size={14} className="text-slate-500 dark:text-slate-400" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-7 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50 min-w-[140px]">
            <button
              onClick={() => { onRename(); setMenuOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Pencil size={13} /> {t('rename')}
            </button>
            <button
              onClick={() => { onDelete(); setMenuOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
            >
              <Trash2 size={13} /> {t('delete')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
