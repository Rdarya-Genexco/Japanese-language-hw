import { useState, useRef, useEffect } from 'react'
import { Folder, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useLang } from '../contexts/LanguageContext'

// Deterministic colour per folder id
const PALETTES = [
  { card: 'bg-blue-50/70 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 hover:border-blue-300',   icon: 'text-blue-500',   menu: 'hover:bg-blue-50 dark:hover:bg-blue-900/30' },
  { card: 'bg-violet-50/70 dark:bg-violet-500/10 border-violet-100 dark:border-violet-500/20 hover:border-violet-300', icon: 'text-violet-500', menu: 'hover:bg-violet-50 dark:hover:bg-violet-900/30' },
  { card: 'bg-rose-50/70 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 hover:border-rose-300',       icon: 'text-rose-500',   menu: 'hover:bg-rose-50 dark:hover:bg-rose-900/30' },
  { card: 'bg-emerald-50/70 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 hover:border-emerald-300', icon: 'text-emerald-500', menu: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/30' },
  { card: 'bg-amber-50/70 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 hover:border-amber-300', icon: 'text-amber-500',  menu: 'hover:bg-amber-50 dark:hover:bg-amber-900/30' },
  { card: 'bg-cyan-50/70 dark:bg-cyan-500/10 border-cyan-100 dark:border-cyan-500/20 hover:border-cyan-300',         icon: 'text-cyan-500',   menu: 'hover:bg-cyan-50 dark:hover:bg-cyan-900/30' },
]

function palette(id = '') {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return PALETTES[h % PALETTES.length]
}

export default function FolderCard({ folder, onClick, onDelete, onRename, isDragTarget, dragOverFolderId, onDropWorksheet }) {
  const { t } = useLang()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const p = palette(folder.id)

  const isOver = isDragTarget && dragOverFolderId === folder.id

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Mouse drag handlers ────────────────────────────────────────────────────
  const handleDragOver = (e) => {
    if (!isDragTarget) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const worksheetId = e.dataTransfer.getData('worksheetId')
    if (worksheetId) onDropWorksheet?.(worksheetId, folder.id)
  }

  return (
    <div
      data-folder-id={folder.id}
      className={`group relative rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer p-4 flex flex-col items-center text-center gap-2 hover:-translate-y-0.5 ${p.card} ${
        isOver ? 'ring-2 ring-violet-400 ring-offset-2 scale-105 shadow-xl brightness-95' : ''
      }`}
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragLeave={() => {}}
      onDrop={handleDrop}
    >
      {/* Drop hint overlay */}
      {isOver && (
        <div className="absolute inset-0 rounded-2xl bg-violet-400/10 flex items-center justify-center pointer-events-none z-10">
          <span className="text-xs font-bold text-violet-600 dark:text-violet-300 bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded-lg shadow">
            {t('moveHere')}
          </span>
        </div>
      )}

      {/* Folder icon */}
      <div className="relative mt-1">
        <Folder className={`w-12 h-12 ${p.icon} transition-transform ${isOver ? 'scale-110' : ''}`} fill="currentColor" fillOpacity={0.25} strokeWidth={1.5} />
      </div>

      {/* Name */}
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 line-clamp-2 w-full leading-snug">{folder.name}</p>

      {/* Context menu */}
      <div ref={menuRef} className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 ring-1 ring-black/5 dark:ring-white/10 transition-all shadow-sm"
        >
          <MoreVertical size={14} className="text-slate-500 dark:text-slate-400" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-7 bg-white dark:bg-slate-800 rounded-xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 p-1 z-50 min-w-[140px]">
            <button
              onClick={() => { onRename(); setMenuOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Pencil size={13} /> {t('rename')}
            </button>
            <button
              onClick={() => { onDelete(); setMenuOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
            >
              <Trash2 size={13} /> {t('delete')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
