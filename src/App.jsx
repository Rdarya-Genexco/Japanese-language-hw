import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider, useLang } from './contexts/LanguageContext'
import { RoleProvider, useRole } from './contexts/RoleContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'
import RoleSelectPage from './pages/RoleSelectPage'
import SharedViewPage from './pages/SharedViewPage'
import ClassesPage from './pages/ClassesPage'
import SquirrelMascot from './components/SquirrelMascot'
import DesktopAuthPage from './pages/DesktopAuthPage'

function ProfileError() {
  const { retryRole } = useRole()
  const { t } = useLang()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-slate-50 dark:bg-slate-950">
      <p className="text-4xl w-20 h-20 inline-flex items-center justify-center bg-white dark:bg-slate-900 rounded-3xl shadow-lg ring-1 ring-black/5 dark:ring-white/10">📡</p>
      <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xs">{t('profileLoadError')}</p>
      <button onClick={retryRole} className="btn-primary text-sm">{t('retry')}</button>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const { role, roleLoading, roleError } = useRole()

  if (loading || roleLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (roleError) return <ProfileError />
  if (!role) return <Navigate to="/role-select" replace />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()
  const { role, roleLoading, roleError } = useRole()
  const { pathname } = useLocation()
  const isSharedView = pathname.startsWith('/s/') || pathname === '/desktop-auth'

  if (loading || roleLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <>
      <Routes>
        <Route path="/login"            element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/role-select"      element={!user ? <Navigate to="/login" replace /> : roleError ? <ProfileError /> : role ? <Navigate to="/" replace /> : <RoleSelectPage />} />
        <Route path="/s/:token"         element={<SharedViewPage />} />
        <Route path="/desktop-auth"     element={<DesktopAuthPage />} />
        <Route path="/settings"         element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/classes"          element={<ProtectedRoute><ClassesPage /></ProtectedRoute>} />
        <Route path="/folder/:folderId" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/"                 element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="*"                 element={<Navigate to="/" replace />} />
      </Routes>
      {/* Public share links (/s/:token) are viewed by outsiders — no mascot there */}
      {!isSharedView && <SquirrelMascot />}
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AuthProvider>
            <RoleProvider>
              <AppRoutes />
            </RoleProvider>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  )
}
