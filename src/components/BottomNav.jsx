import { useNavigate, useLocation } from 'react-router-dom'
import { useRole } from '../contexts/RoleContext'
import { useLang } from '../contexts/LanguageContext'
import { Home, School, Settings, Upload } from 'lucide-react'

export default function BottomNav({ onUpload }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { role } = useRole()
  const { t } = useLang()

  const isHome = pathname === '/' || pathname.startsWith('/folder/')
  const isClasses = pathname === '/classes'
  const isSettings = pathname === '/settings'

  const items = [
    {
      icon: Home,
      label: t('navHome'),
      active: isHome,
      onClick: () => navigate('/'),
    },
    ...(role === 'teacher' ? [{
      icon: School,
      label: t('navClasses'),
      active: isClasses,
      onClick: () => navigate('/classes'),
    }] : []),
    {
      icon: Upload,
      label: t('upload'),
      active: false,
      primary: true,
      // Pages without their own upload dialog send the user home and open it there
      onClick: onUpload || (() => navigate('/', { state: { openUpload: true } })),
    },
    {
      icon: Settings,
      label: t('settings'),
      active: isSettings,
      onClick: () => navigate('/settings'),
    },
  ]

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/80 dark:border-white/10 flex items-stretch md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {items.map(item => (
        <button
          key={item.label}
          onClick={item.onClick}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors relative isolate ${
            item.primary
              ? 'text-white'
              : item.active
              ? 'text-violet-600 dark:text-violet-400'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          {item.primary ? (
            <div className="w-10 h-10 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-600/30 ring-4 ring-white dark:ring-slate-900 -mt-4">
              <item.icon size={18} className="text-white" />
            </div>
          ) : (
            <>
              <item.icon size={20} strokeWidth={item.active ? 2.5 : 1.8} />
              {item.active && (
                <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-12 h-8 bg-violet-100 dark:bg-violet-500/20 rounded-full -z-10" />
              )}
            </>
          )}
          <span className={`text-[11px] font-medium leading-none ${item.primary ? 'text-violet-600 dark:text-violet-400' : ''}`}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  )
}
