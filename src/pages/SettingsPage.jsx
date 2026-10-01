import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'
import { useRole } from '../contexts/RoleContext'
import { LANGUAGES } from '../utils/languages'
import { ArrowLeft, Globe, GraduationCap, BookOpen, Copy, Check } from 'lucide-react'
import { createClassroom, getClassroom, getUserRole } from '../utils/storageService'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { langCode, setLangCode, t } = useLang()
  const { role, saveRole } = useRole()
  const navigate = useNavigate()
  const [classCode, setClassCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinStatus, setJoinStatus] = useState(null)
  const [creatingClass, setCreatingClass] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [changingRole, setChangingRole] = useState(false)

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch {}
  }

  const handleCreateClassroom = async () => {
    setCreatingClass(true)
    try {
      const code = await createClassroom(user.uid)
      setClassCode(code)
    } catch (err) {
      alert('Failed to create classroom: ' + err.message)
    } finally {
      setCreatingClass(false)
    }
  }

  const handleChangeRole = async (newRole) => {
    setChangingRole(true)
    try {
      await saveRole(newRole)
    } finally {
      setChangingRole(false)
    }
  }

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

        {/* Role toggle */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-3">My Role</h2>
          <div className="flex gap-2">
            <button
              onClick={() => handleChangeRole('student')}
              disabled={changingRole || role === 'student'}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all disabled:cursor-not-allowed ${
                role === 'student'
                  ? 'bg-violet-100 dark:bg-violet-900/40 border-violet-400 dark:border-violet-500 text-violet-700 dark:text-violet-300'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-600'
              }`}
            >
              <BookOpen size={15} /> Student
            </button>
            <button
              onClick={() => handleChangeRole('teacher')}
              disabled={changingRole || role === 'teacher'}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all disabled:cursor-not-allowed ${
                role === 'teacher'
                  ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-600'
              }`}
            >
              <GraduationCap size={15} /> Teacher
            </button>
          </div>
        </div>

        {/* Teacher — classroom section */}
        {role === 'teacher' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-3">Classroom Code</h2>
            {classCode ? (
              <div className="flex items-center gap-2">
                <span className="flex-1 text-center font-mono font-black text-2xl tracking-widest text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-700 rounded-xl py-2">
                  {classCode}
                </span>
                <button
                  onClick={() => handleCopyCode(classCode)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    copiedCode ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                  {copiedCode ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleCreateClassroom}
                disabled={creatingClass}
                className="btn-primary w-full justify-center text-sm"
              >
                {creatingClass ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : '🏫'}
                {creatingClass ? 'Creating…' : 'Create Classroom'}
              </button>
            )}
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              Share this code with students so they can submit worksheets to you.
            </p>
          </div>
        )}

        {/* Student — join classroom section */}
        {role === 'student' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-3">Join a Classroom</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Enter the code your teacher gave you to submit worksheets.
            </p>
            {joinStatus === 'ok' ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium text-center py-2">
                ✅ Classroom found! Use this code when submitting worksheets.
              </p>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinStatus(null) }}
                  placeholder="e.g. AB12CD"
                  maxLength={10}
                  className="input flex-1 uppercase tracking-widest font-mono text-center"
                />
                <button
                  onClick={async () => {
                    if (!joinCode.trim()) return
                    const room = await getClassroom(joinCode.trim())
                    setJoinStatus(room ? 'ok' : 'not-found')
                  }}
                  className="btn-primary text-sm flex-shrink-0"
                >
                  Verify
                </button>
              </div>
            )}
            {joinStatus === 'not-found' && (
              <p className="text-xs text-rose-500 mt-2">Classroom not found. Check the code and try again.</p>
            )}
          </div>
        )}

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
