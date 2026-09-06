import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'
import { LANGUAGES } from '../utils/languages'
import { ArrowLeft, Globe } from 'lucide-react'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { langCode, setLangCode, t } = useLang()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 dark:from-indigo-900 dark:via-blue-900 dark:to-violet-900 sticky top-0 z-40 shadow-md">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <span className="font-bold text-white">{t('settings')}</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-5 space-y-4">

        {/* User card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-600" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
              {user?.displayName?.[0] || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-slate-800 dark:text-slate-100 truncate text-sm">{user.displayName}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
          </div>
          <button
            onClick={logout}
            className="text-sm text-red-500 dark:text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
          >
            {t('signOut')}
          </button>
        </div>

        {/* Language picker */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Globe size={16} className="text-violet-600 dark:text-violet-400" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{t('language')}</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t('chooseYourLanguage')}</p>
          <div className="grid grid-cols-4 gap-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setLangCode(lang.code)}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border transition-all text-xs font-medium ${
                  langCode === lang.code
                    ? 'bg-violet-100 dark:bg-violet-900/40 border-violet-400 dark:border-violet-500 text-violet-700 dark:text-violet-300'
                    : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-300'
                }`}
              >
                <span className="text-lg leading-none">{lang.flag}</span>
                <span className="truncate w-full text-center">{lang.native}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
