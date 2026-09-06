import { useState, useRef, useEffect } from 'react'
import { FolderPlus, X } from 'lucide-react'
import { useLang } from '../contexts/LanguageContext'

export default function NewFolderModal({ onCreate, onClose }) {
  const { t } = useLang()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await onCreate(name.trim())
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Coloured header */}
        <div className="bg-gradient-to-r from-indigo-500 to-violet-600 px-6 pt-5 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderPlus size={18} className="text-white" />
            <h2 className="font-bold text-white">{t('newFolderTitle')}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            <X size={15} className="text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              {t('folderName')}
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('folderPlaceholder')}
              className="input"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              {t('cancel')}
            </button>
            <button type="submit" disabled={!name.trim() || loading} className="btn-primary flex-1 justify-center">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : t('create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
