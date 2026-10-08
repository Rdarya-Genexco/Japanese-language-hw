import { useLang } from '../contexts/LanguageContext'

export default function EmptyState() {
  const { t } = useLang()

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-6">
        <div className="w-28 h-28 bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-white/10 rounded-3xl flex items-center justify-center shadow-lg rotate-3">
          <span className="text-5xl">📄</span>
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/30 ring-4 ring-slate-50 dark:ring-slate-950 text-lg">
          ✨
        </div>
      </div>
      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
        {t('empty')}
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs leading-relaxed">
        {t('emptyDesc')}
      </p>
    </div>
  )
}
