import { Smartphone } from 'lucide-react'
import { useLang } from '../contexts/LanguageContext'
import { useInstallPrompt, canOfferAndroidInstall } from '../hooks/useInstallPrompt'

/** "Download for Android" inside the app (home page on Android phones, and Settings). */
export default function AndroidInstallCard({ className = '' }) {
  const { t } = useLang()
  const { install, showHelp } = useInstallPrompt()
  if (!canOfferAndroidInstall()) return null
  return (
    <div className={`card p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
          <Smartphone size={18} className="text-emerald-600 dark:text-emerald-400" />
        </span>
        <p className="flex-1 min-w-0 text-sm font-semibold text-slate-800 dark:text-slate-100">{t('getTheApp')}</p>
        <button
          type="button"
          onClick={install}
          aria-expanded={showHelp}
          className="flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
        >
          {t('downloadAndroid')}
        </button>
      </div>
      {showHelp && (
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed bg-slate-50 dark:bg-slate-900/40 rounded-lg px-3 py-2" role="status">
          📱 {t('androidInstallHelp')}
        </p>
      )}
    </div>
  )
}
