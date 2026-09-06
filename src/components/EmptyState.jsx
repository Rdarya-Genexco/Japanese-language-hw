import { Upload, FolderPlus } from 'lucide-react'
import { useLang } from '../contexts/LanguageContext'

export default function EmptyState({ onUpload, onNewFolder }) {
  const { t } = useLang()

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-6">
        <div className="w-28 h-28 bg-gradient-to-br from-indigo-100 via-blue-100 to-violet-100 dark:from-indigo-900/40 dark:via-blue-900/40 dark:to-violet-900/40 rounded-3xl flex items-center justify-center shadow-inner">
          <span className="text-5xl">📄</span>
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg text-lg">
          ✨
        </div>
      </div>
      <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">
        {t('empty')}
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 max-w-xs leading-relaxed">
        {t('emptyDesc')}
      </p>
      <div className="flex gap-3">
        <button onClick={onNewFolder} className="btn-secondary text-sm">
          <FolderPlus size={16} /> {t('createFolder')}
        </button>
        <button onClick={onUpload} className="btn-primary text-sm">
          <Upload size={16} /> {t('uploadFile')}
        </button>
      </div>
    </div>
  )
}
