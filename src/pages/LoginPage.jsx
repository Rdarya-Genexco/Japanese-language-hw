import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'
import { LANGUAGES } from '../utils/languages'

export default function LoginPage() {
  const { signInWithGoogle } = useAuth()
  const { langCode, setLangCode, t } = useLang()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignIn = async () => {
    setLoading(true); setError('')
    try {
      await signInWithGoogle()
    } catch {
      setError(t('loginError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-700 dark:from-indigo-950 dark:via-blue-950 dark:to-violet-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-400/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-300/10 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl border border-white/30">
            <span className="text-6xl leading-none">🌉</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-sm">
            Doc Translate
          </h1>
          <p className="text-white/70 text-sm mt-2">{t('tagline')}</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-7 shadow-2xl border border-white/20">
          {/* Language picker */}
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 text-center">
            {t('chooseYourLanguage')}
          </p>
          <div className="grid grid-cols-4 gap-1.5 mb-5">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setLangCode(lang.code)}
                className={`flex flex-col items-center gap-1 px-1 py-2 rounded-xl text-center text-xs font-medium border transition-all ${
                  langCode === lang.code
                    ? 'bg-violet-100 dark:bg-violet-900/40 border-violet-400 dark:border-violet-500 text-violet-700 dark:text-violet-300'
                    : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-violet-300 dark:hover:border-violet-600'
                }`}
              >
                <span className="text-lg leading-none">{lang.flag}</span>
                <span className="leading-tight truncate w-full text-center" style={{ fontSize: '10px' }}>{lang.native}</span>
              </button>
            ))}
          </div>

          <h2 className="text-base font-bold text-slate-700 dark:text-slate-200 text-center mb-4">
            {t('loginTitle')}
          </h2>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-3 mb-4 text-rose-600 dark:text-rose-400 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 hover:border-violet-400 dark:hover:border-violet-500 hover:shadow-lg rounded-2xl px-4 py-3.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
              {loading ? t('signingIn') : t('signIn')}
            </span>
          </button>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
            {t('termsNote')}
          </p>
        </div>

        {/* Feature pills */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {[
            { icon: '📄', key: 'pdfDesc' },
            { icon: '🤖', key: 'aiAuto' },
            { icon: '📁', key: 'folderMgmt' },
            { icon: '🌙', key: 'darkModeFeature' },
          ].map(f => (
            <div key={f.key} className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-medium px-3 py-1.5 rounded-full">
              <span>{f.icon}</span> {t(f.key)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
