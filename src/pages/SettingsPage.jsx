import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'
import { useRole } from '../contexts/RoleContext'
import { LANGUAGES } from '../utils/languages'
import { ArrowLeft, Globe, BookOpen, GraduationCap, Check, Loader2 } from 'lucide-react'
import { getClassroom, getClassroomMember } from '../utils/firestoreService'
import BottomNav from '../components/BottomNav'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { langCode, setLangCode, t } = useLang()
  const { role, saveRole, classroomCode, saveClassroomCode } = useRole()
  const navigate = useNavigate()

  const [changingRole, setChangingRole] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinStatus, setJoinStatus] = useState(null) // null | 'ok' | 'not-found' | 'verifying'
  const [changingCode, setChangingCode] = useState(false)

  const handleChangeRole = async (newRole) => {
    if (newRole === role) return
    setChangingRole(true)
    try {
      await saveRole(newRole)
    } finally {
      setChangingRole(false)
    }
  }

  const handleVerifyJoin = async () => {
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    setJoinStatus('verifying')
    try {
      const room = await getClassroom(code)
      const member = room ? await getClassroomMember(code, user.uid).catch(() => null) : null
      if (member?.removed) {
        setJoinStatus('removed')
      } else if (room) {
        setJoinStatus('ok')
        setChangingCode(false)
        await saveClassroomCode(code)
      } else {
        setJoinStatus('not-found')
      }
    } catch {
      setJoinStatus('not-found')
    }
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <BottomNav />
      {/* Header */}
      <header className="bg-slate-900/95 dark:bg-slate-950/90 backdrop-blur-md border-b border-white/10 shadow-md flex-shrink-0 safe-top">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 bg-white/5 hover:bg-white/15 ring-1 ring-white/10 rounded-lg transition-colors">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <span className="font-bold tracking-tight text-white">{t('settings')}</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto w-full flex-1 overflow-y-auto px-4 py-6 space-y-4 with-bottom-nav">

        {/* User + sign out */}
        <div className="card p-4 flex items-center gap-3.5">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full ring-2 ring-violet-200 dark:ring-violet-700 flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-lg font-bold shadow-sm flex-shrink-0">
              {user?.displayName?.[0] || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-900 dark:text-white truncate">{user.displayName}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
          </div>
          <button
            onClick={logout}
            className="text-xs text-rose-600 dark:text-rose-400 px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex-shrink-0 font-semibold"
          >
            {t('signOut')}
          </button>
        </div>

        {/* Role toggle */}
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">{t('role')}</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleChangeRole('student')}
              disabled={changingRole}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all disabled:opacity-60 ${
                role === 'student'
                  ? 'bg-violet-50 dark:bg-violet-900/40 border-violet-500 text-violet-700 dark:text-violet-300 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-violet-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {changingRole && role !== 'student' ? <Loader2 size={12} className="animate-spin" /> : <BookOpen size={12} />}
              {t('student')}
            </button>
            <button
              onClick={() => handleChangeRole('teacher')}
              disabled={changingRole}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all disabled:opacity-60 ${
                role === 'teacher'
                  ? 'bg-cyan-50 dark:bg-cyan-900/30 border-cyan-500 text-cyan-700 dark:text-cyan-300 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-cyan-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {changingRole && role !== 'teacher' ? <Loader2 size={12} className="animate-spin" /> : <GraduationCap size={12} />}
              {t('teacher')}
            </button>
          </div>
        </div>

        {/* Student: join classroom */}
        {role === 'student' && (
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">{t('classroom')}</p>
            {classroomCode && !changingCode && joinStatus !== 'ok' ? (
              <div className="flex items-center gap-2">
                <span className="flex-1 font-mono font-black text-lg text-center tracking-[0.25em] text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30 rounded-xl py-2 border-2 border-dashed border-violet-300 dark:border-violet-600">
                  {classroomCode}
                </span>
                <button
                  onClick={() => { setJoinCode(''); setJoinStatus(null); setChangingCode(true) }}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {t('change')}
                </button>
              </div>
            ) : joinStatus === 'ok' ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium text-center py-1.5 flex items-center justify-center gap-1.5">
                <Check size={14} /> {t('joinedExcl')}
              </p>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinStatus(null) }}
                  placeholder={t('codeFromTeacher')}
                  maxLength={10}
                  className="input flex-1 uppercase tracking-widest font-mono text-center text-sm"
                />
                <button
                  onClick={handleVerifyJoin}
                  disabled={!joinCode.trim() || joinStatus === 'verifying'}
                  className="btn-primary text-xs flex-shrink-0 px-3"
                >
                  {joinStatus === 'verifying' ? <Loader2 size={12} className="animate-spin" /> : t('join')}
                </button>
              </div>
            )}
            {joinStatus === 'not-found' && (
              <p className="text-xs text-rose-500 mt-1">{t('classroomNotFound')}</p>
            )}
            {joinStatus === 'removed' && (
              <p className="text-xs text-rose-500 mt-1">{t('removedFromClass')}</p>
            )}
          </div>
        )}

        {/* Language picker */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={13} className="text-violet-600 dark:text-violet-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('language')}</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setLangCode(lang.code)}
                className={`flex flex-col items-center gap-1 px-1 py-2.5 rounded-xl border transition-all text-xs font-medium ${
                  langCode === lang.code
                    ? 'bg-violet-50 dark:bg-violet-900/40 border-violet-500 text-violet-700 dark:text-violet-300 ring-2 ring-violet-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-violet-300 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-base leading-none">{lang.flag}</span>
                <span className="truncate w-full text-center" style={{ fontSize: '9px' }}>{lang.native}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
