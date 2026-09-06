import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useLang } from '../contexts/LanguageContext'
import { LANGUAGES } from '../utils/languages'
import { LogOut, Sun, Moon, Settings, ChevronDown } from 'lucide-react'

export default function Header() {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const { langCode, setLangCode, t } = useLang()
  const navigate = useNavigate()
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef(null)

  const currentLang = LANGUAGES.find(l => l.code === langCode) ?? LANGUAGES[1]

  // Close dropdown on outside click
  useEffect(() => {
    if (!langOpen) return
    const handler = (e) => { if (!langRef.current?.contains(e.target)) setLangOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [langOpen])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 dark:from-indigo-900 dark:via-blue-900 dark:to-violet-900 sticky top-0 z-40 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-sm">
            <span className="text-lg leading-none">🌉</span>
          </div>
          <span className="font-bold text-white hidden sm:block tracking-tight">Doc Translate</span>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-1.5">

          {/* Language picker dropdown */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(v => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white text-sm font-medium"
              title={t('language')}
            >
              <span className="text-base leading-none">{currentLang.flag}</span>
              <span className="hidden sm:block">{currentLang.native}</span>
              <ChevronDown size={13} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 grid grid-cols-2 gap-1 w-52 z-50">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setLangCode(lang.code); setLangOpen(false) }}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs font-medium transition-all ${
                      langCode === lang.code
                        ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-base leading-none">{lang.flag}</span>
                    <span className="truncate">{lang.native}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dark / Light toggle */}
          <button
            onClick={toggle}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
            title={dark ? t('lightMode') : t('darkMode')}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Settings */}
          <button
            onClick={() => navigate('/settings')}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
            title={t('settings')}
          >
            <Settings size={16} />
          </button>

          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full ring-2 ring-white/40 hidden sm:block" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white text-xs font-bold hidden sm:block">
              {user?.displayName?.[0] || '?'}
            </div>
          )}

          <button
            onClick={handleLogout}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
            title={t('signOut')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
