import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LanguageContext'
import { useRole } from '../contexts/RoleContext'
import { LANGUAGES } from '../utils/languages'
import { ArrowLeft, Globe, BookOpen, GraduationCap, Check, Loader2, Trash2, AlertTriangle } from 'lucide-react'
import { getClassroom, getClassroomMember, deleteAccountData } from '../utils/firestoreService'
import { errorText } from '../utils/appError'
import BottomNav from '../components/BottomNav'
import AndroidInstallCard from '../components/AndroidInstallCard'
import { tourText, TOUR_REPLAY_EVENT } from '../utils/tanuTour'

export default function SettingsPage() {
  const { user, logout, deleteAccount } = useAuth()
  const { langCode, setLangCode, t } = useLang()
  const { role, saveRole, classroomCode, saveClassroomCode, tanuHidden, saveTanuHidden } = useRole()
  const navigate = useNavigate()

  const [changingRole, setChangingRole] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinStatus, setJoinStatus] = useState(null) // null | 'ok' | 'not-found' | 'verifying'
  const [changingCode, setChangingCode] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

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

      <div className="max-w-lg mx-auto w-full flex-1 overflow-y-auto px-4 py-6 space-y-4 with-bottom-nav" data-tour="settings-panel">

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
            data-tour="settings-signout"
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
          <div className="card p-4" data-tour="settings-classroom">
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

        {/* Students: switch Tanu's tips on/off (also hidden with the × on Tanu) */}
        {role === 'student' && (
          <label className="card p-4 flex items-center gap-3 cursor-pointer">
            <span className="text-xl">🍃</span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{t('showTanu')}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{t('showTanuDesc')}</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={!tanuHidden}
              onChange={e => saveTanuHidden(!e.target.checked)}
              className="peer sr-only"
            />
            <span aria-hidden="true" className="relative w-10 h-6 rounded-full bg-slate-300 dark:bg-slate-600 peer-checked:bg-emerald-500 transition-colors after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-400" />
          </label>
        )}

        {/* Download for Android (any device; hidden inside the installed or desktop app) */}
        <AndroidInstallCard />

        {/* Replay Tanu's first-run tour */}
        <button
          onClick={() => window.dispatchEvent(new Event(TOUR_REPLAY_EVENT))}
          className="w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-left text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
        >
          🍃 {tourText('replayTour', langCode)}
        </button>

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

        {/* Delete account (not for guest sessions, which keep nothing) */}
        {!user.isAnonymous && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900 px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
          >
            <Trash2 size={15} /> {t('deleteAccount')}
          </button>
        )}

      </div>

      {confirmDelete && (
        <DeleteAccountDialog
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => deleteAccount(() => deleteAccountData(user.uid, { classroomCode }))
            .then(() => navigate('/login', { replace: true }))}
        />
      )}
    </div>
  )
}

/** "Are you sure?" popup. Stays open with the error if deleting fails. */
function DeleteAccountDialog({ onCancel, onConfirm }) {
  const { t } = useLang()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const confirm = async () => {
    setBusy(true); setError('')
    try {
      await onConfirm()
    } catch (err) {
      const code = err?.code || ''
      // Closing Google's sign-in window just cancels
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') setError('')
      else setError(t('deleteAccountFailed') + ': ' + errorText(err, t))
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="delete-account-title">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-5">
        <div className="w-11 h-11 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center mb-3">
          <AlertTriangle size={20} className="text-rose-600 dark:text-rose-400" />
        </div>
        <h2 id="delete-account-title" className="font-bold text-lg text-slate-900 dark:text-white">{t('deleteAccountTitle')}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{t('deleteAccountBody')}</p>
        {!window.docTranslateDesktop && <p className="text-xs text-slate-400 mt-2">{t('deleteNeedsSignIn')}</p>}
        {error && <p className="text-xs text-rose-600 dark:text-rose-400 mt-3">{error}</p>}
        <div className="flex gap-2 mt-5">
          <button onClick={onCancel} disabled={busy} className="btn-secondary flex-1 justify-center text-sm">{t('cancel')}</button>
          <button
            onClick={confirm}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold rounded-xl px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white"
          >
            {busy ? <><Loader2 size={14} className="animate-spin" /> {t('deletingAccount')}</> : t('deleteForever')}
          </button>
        </div>
      </div>
    </div>
  )
}
