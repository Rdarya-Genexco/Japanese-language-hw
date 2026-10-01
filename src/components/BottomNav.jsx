import { useNavigate, useLocation } from 'react-router-dom'
import { useRole } from '../contexts/RoleContext'
import { Home, School, Settings, Upload } from 'lucide-react'

export default function BottomNav({ onUpload }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { role } = useRole()

  const isHome = pathname === '/' || pathname.startsWith('/folder/')
  const isClasses = pathname === '/classes'
  const isSettings = pathname === '/settings'

  const items = [
    {
      icon: Home,
      label: 'Home',
      active: isHome,
      onClick: () => navigate('/'),
    },
    ...(role === 'teacher' ? [{
      icon: School,
      label: 'Classes',
      active: isClasses,
      onClick: () => navigate('/classes'),
    }] : []),
    {
      icon: Upload,
      label: 'Upload',
      active: false,
      primary: true,
      onClick: onUpload,
    },
    {
      icon: Settings,
      label: 'Settings',
      active: isSettings,
      onClick: () => navigate('/settings'),
    },
  ]

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-stretch md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {items.map(item => (
        <button
          key={item.label}
          onClick={item.onClick}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors relative ${
            item.primary
              ? 'text-white'
              : item.active
              ? 'text-violet-600 dark:text-violet-400'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          {item.primary ? (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 -mt-3">
              <item.icon size={18} className="text-white" />
            </div>
          ) : (
            <>
              <item.icon size={20} strokeWidth={item.active ? 2.5 : 1.8} />
              {item.active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-violet-500 rounded-full" />
              )}
            </>
          )}
          <span className={`text-xs leading-none ${item.primary ? 'text-violet-600 dark:text-violet-400' : ''}`}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  )
}
