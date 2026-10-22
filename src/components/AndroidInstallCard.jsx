import { useState } from 'react'
import { Smartphone, X } from 'lucide-react'
import { useLang } from '../contexts/LanguageContext'
import { ANDROID_APK_URL, canOfferAndroidInstall } from '../hooks/androidApp'

const DISMISS_KEY = 'doc-translate-android-card-dismissed'
const wasDismissed = () => { try { return localStorage.getItem(DISMISS_KEY) === '1' } catch { return false } }

/**
 * "Download for Android" inside the app. On the home page it is a compact row that can be closed
 * (dismissible); Settings always shows it so it stays easy to find.
 */
export default function AndroidInstallCard({ className = '', dismissible = false }) {
  const { t } = useLang()
  const [hidden, setHidden] = useState(() => dismissible && wasDismissed())
  if (!canOfferAndroidInstall() || hidden) return null

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* storage unavailable: hide for now only */ }
    setHidden(true)
  }

  return (
    <div className={`card p-3 sm:p-4 ${className}`}>
      <div className="flex items-center gap-2.5 sm:gap-3">
        <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
          <Smartphone size={16} className="text-emerald-600 dark:text-emerald-400" />
        </span>
        <p className="flex-1 min-w-0 text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{t('getTheApp')}</p>
        <a
          href={ANDROID_APK_URL}
          className="flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
        >
          {t('downloadAndroid')}
        </a>
        {dismissible && (
          <button
            type="button"
            onClick={dismiss}
            aria-label={t('close')}
            title={t('close')}
            className="flex-shrink-0 -mr-1 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={15} />
          </button>
        )}
      </div>
      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-2 leading-snug">{t('androidInstallHelp')}</p>
    </div>
  )
}
