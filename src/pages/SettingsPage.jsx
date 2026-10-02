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
      <header className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 dark:from-indigo-900 dark:via-blue-900 dark:to-violet-900 flex-shrink-0 safe-top">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <span className="font-bold text-white">{t('settings')}</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto w-full flex-1 overflow-y-auto p-4 space-y-3 with-bottom-nav">

        {/* User + sign out */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-600 flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold flex-shrink-0">
              {user?.displayName?.[0] || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-slate-800 dark:text-slate-100 truncate text-sm">{user.displayName}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
          </div>
          <button
            onClick={logout}
            className="text-xs text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0 font-medium"
          >
            {t('signOut')}
          </button>
        </div>

        {/* Role toggle */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Role</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleChangeRole('student')}
              disabled={changingRole}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 text-xs font-semibold transition-all disabled:opacity-60 ${
                role === 'student'
                  ? 'bg-violet-100 dark:bg-violet-900/40 border-violet-400 dark:border-violet-500 text-violet-700 dark:text-violet-300'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-300'
              }`}
            >
              {changingRole && role !== 'student' ? <Loader2 size={12} className="animate-spin" /> : <BookOpen size={12} />}
              Student
            </button>
            <button
              onClick={() => handleChangeRole('teacher')}
              disabled={changingRole}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 text-xs font-semibold transition-all disabled:opacity-60 ${
                role === 'teacher'
                  ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-300'
              }`}
            >
              {changingRole && role !== 'teacher' ? <Loader2 size={12} className="animate-spin" /> : <GraduationCap size={12} />}
              Teacher
            </button>
          </div>
        </div>

        {/* Student: join classroom */}
        {role === 'student' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Classroom</p>
            {classroomCode && !changingCode && joinStatus !== 'ok' ? (
              <div className="flex items-center gap-2">
                <span className="flex-1 font-mono font-black text-lg text-center tracking-widest text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl py-1.5 border border-cyan-200 dark:border-cyan-700">
                  {classroomCode}
                </span>
                <button
                  onClick={() => { setJoinCode(''); setJoinStatus(null); setChangingCode(true) }}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Change
                </button>
              </div>
            ) : joinStatus === 'ok' ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium text-center py-1.5 flex items-center justify-center gap-1.5">
                <Check size={14} /> Joined!
              </p>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinStatus(null) }}
                  placeholder="Code from teacher"
                  maxLength={10}
                  className="input flex-1 uppercase tracking-widest font-mono text-center text-sm"
                />
                <button
                  onClick={handleVerifyJoin}
                  disabled={!joinCode.trim() || joinStatus === 'verifying'}
                  className="btn-primary text-xs flex-shrink-0 px-3"
                >
                  {joinStatus === 'verifying' ? <Loader2 size={12} className="animate-spin" /> : 'Join'}
                </button>
              </div>
            )}
            {joinStatus === 'not-found' && (
              <p className="text-xs text-rose-500 mt-1">Classroom not found.</p>
            )}
            {joinStatus === 'removed' && (
              <p className="text-xs text-rose-500 mt-1">Your teacher removed you from this class. Ask them for help.</p>
            )}
          </div>
        )}

        {/* Language picker */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Globe size={13} className="text-violet-600 dark:text-violet-400" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('language')}</p>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setLangCode(lang.code)}
                className={`flex flex-col items-center gap-0.5 px-1 py-2 rounded-xl border transition-all text-xs font-medium ${
                  langCode === lang.code
                    ? 'bg-violet-100 dark:bg-violet-900/40 border-violet-400 dark:border-violet-500 text-violet-700 dark:text-violet-300'
                    : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-violet-300'
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
