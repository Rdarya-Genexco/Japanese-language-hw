import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useLang } from '../contexts/LanguageContext'
import { useRole } from '../contexts/RoleContext'
import { LANGUAGES } from '../utils/languages'
import { LogOut, Sun, Moon, Settings, ChevronDown, School } from 'lucide-react'
import Logo from './Logo'

export default function Header({ streak = 0 }) {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const { langCode, setLangCode, t } = useLang()
  const { role } = useRole()
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
    <header
      className="bg-slate-900/95 dark:bg-slate-950/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-40 shadow-md safe-top"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 -ml-1.5 pl-1.5 pr-2 py-1 rounded-xl hover:bg-white/5 transition-colors"
        >
          <Logo size={32} />
          <span className="font-bold text-white tracking-tight">Doc Translate</span>
          <span className="text-white/40 text-xs font-medium hidden md:block border-l border-white/10 pl-2.5">{t('headerTagline')}</span>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          {/* Student streak badge */}
          {role === 'student' && streak > 0 && (
            <div className="flex items-center gap-1 bg-gradient-to-r from-amber-400/25 to-orange-500/25 ring-1 ring-amber-300/40 text-amber-100 px-2.5 py-1 rounded-full shadow-sm shadow-amber-500/20 text-xs font-bold">
              🔥 {streak}
            </div>
          )}
          {/* Teacher classes nav */}
          {role === 'teacher' && (
            <button
              onClick={() => navigate('/classes')}
              className="hidden sm:flex items-center gap-1.5 bg-white/5 ring-1 ring-white/10 hover:bg-white/15 text-white/90 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              <School size={12} /> {t('navClasses')}
            </button>
          )}

          {/* Language picker dropdown */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(v => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/15 ring-1 ring-white/10 rounded-lg transition-colors text-white text-sm font-medium"
              title={t('language')}
            >
              <span className="text-base leading-none">{currentLang.flag}</span>
              <span className="hidden sm:block">{currentLang.native}</span>
              <ChevronDown size={13} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 p-1.5 grid grid-cols-2 gap-1 w-52 z-50">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setLangCode(lang.code); setLangOpen(false) }}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs font-medium transition-all ${
                      langCode === lang.code
                        ? 'bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 ring-1 ring-violet-200 dark:ring-violet-700/60'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
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
            className="p-2 bg-white/5 hover:bg-white/15 ring-1 ring-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
            title={dark ? t('lightMode') : t('darkMode')}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Settings — hidden on mobile (use bottom nav) */}
          <button
            onClick={() => navigate('/settings')}
            className="hidden md:block p-2 bg-white/5 hover:bg-white/15 ring-1 ring-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
            title={t('settings')}
          >
            <Settings size={16} />
          </button>

          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full ring-2 ring-violet-400/60 ring-offset-2 ring-offset-slate-900 hidden sm:block" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 ring-2 ring-white/10 flex items-center justify-center text-white text-xs font-bold hidden sm:flex">
              {user?.displayName?.[0] || '?'}
            </div>
          )}

          <button
            onClick={handleLogout}
            className="hidden md:block p-2 bg-white/5 hover:bg-white/15 ring-1 ring-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
            title={t('signOut')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
