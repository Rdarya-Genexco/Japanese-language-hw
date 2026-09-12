import { useState, useEffect } from 'react'
import { X, Folder, Home, Loader2 } from 'lucide-react'
import { getAllFolders } from '../utils/storageService'
import { useLang } from '../contexts/LanguageContext'

export default function MoveToModal({ uid, worksheetName, currentFolderId, onMove, onClose }) {
  const { t } = useLang()
  const [folders, setFolders]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [moving,  setMoving]    = useState(false)
  const [selected, setSelected] = useState(null) // folderId

  useEffect(() => {
    getAllFolders(uid)
      .then(all => setFolders(all.filter(f => f.id !== currentFolderId)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [uid, currentFolderId])

  const handleMove = async () => {
    if (selected === null) return
    setMoving(true)
    await onMove(selected === 'root' ? 'root' : selected)
    onClose()
  }

  const ROOT = { id: 'root', name: 'My Drive (Root)' }
  const targets = currentFolderId === 'root'
    ? folders
    : [ROOT, ...folders]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 px-5 pt-4 pb-3 flex items-center justify-between">
          <div>
            <p className="font-bold text-white text-sm">Move to folder</p>
            <p className="text-white/60 text-xs mt-0.5 truncate max-w-[220px]">{worksheetName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            <X size={15} className="text-white" />
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Loading folders…</span>
            </div>
          ) : targets.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">No other folders to move to.</p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {targets.map(folder => {
                const isRoot = folder.id === 'root'
                const isSelected = selected === folder.id
                return (
                  <button
                    key={folder.id}
                    onClick={() => setSelected(folder.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all ${
                      isSelected
                        ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-semibold ring-1 ring-violet-300 dark:ring-violet-600'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isRoot
                      ? <Home size={16} className="text-slate-400 flex-shrink-0" />
                      : <Folder size={16} className="text-violet-400 flex-shrink-0" fill="currentColor" fillOpacity={0.3} />
                    }
                    <span className="truncate">{folder.name}</span>
                  </button>
                )
              })}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center text-sm">
              {t('cancel')}
            </button>
            <button
              onClick={handleMove}
              disabled={selected === null || moving}
              className="btn-primary flex-1 justify-center text-sm disabled:opacity-50"
            >
              {moving ? <Loader2 size={14} className="animate-spin" /> : <Folder size={14} />}
              Move
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
