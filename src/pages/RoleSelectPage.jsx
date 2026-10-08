import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../contexts/RoleContext'
import { useLang } from '../contexts/LanguageContext'
import { GraduationCap, BookOpen } from 'lucide-react'

export default function RoleSelectPage() {
  const { saveRole } = useRole()
  const { t } = useLang()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(null)

  const handleSelect = async (role) => {
    setSaving(role)
    try {
      await saveRole(role)
      navigate('/', { replace: true })
    } catch {
      setSaving(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-violet-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-8">
          <span className="text-5xl mb-5 inline-flex w-20 h-20 items-center justify-center bg-white/5 ring-1 ring-white/10 rounded-3xl shadow-xl">🌉</span>
          <h1 className="text-3xl font-bold tracking-tight text-white">{t('whoAreYou')}</h1>
          <p className="text-white/60 mt-2 text-sm">{t('chooseRoleDesc')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Student card */}
          <button
            onClick={() => handleSelect('student')}
            disabled={!!saving}
            className="group relative bg-white/[0.04] backdrop-blur-sm border border-white/10 hover:border-violet-400/60 hover:bg-violet-500/10 hover:shadow-violet-500/20 rounded-3xl p-7 text-left transition-all duration-200 disabled:opacity-60 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-pink-500 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-violet-500/30 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
              <BookOpen size={30} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{t('student')}</h2>
            <p className="text-white/55 text-sm leading-relaxed">
              {t('studentRoleDesc')}
            </p>
            {saving === 'student' && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm rounded-3xl">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>

          {/* Teacher card */}
          <button
            onClick={() => handleSelect('teacher')}
            disabled={!!saving}
            className="group relative bg-white/[0.04] backdrop-blur-sm border border-white/10 hover:border-cyan-400/60 hover:bg-cyan-500/10 hover:shadow-cyan-500/20 rounded-3xl p-7 text-left transition-all duration-200 disabled:opacity-60 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-cyan-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <GraduationCap size={30} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{t('teacher')}</h2>
            <p className="text-white/55 text-sm leading-relaxed">
              {t('teacherRoleDesc')}
            </p>
            {saving === 'teacher' && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm rounded-3xl">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
        </div>

        <p className="text-center text-white/40 text-xs mt-8">
          {t('changeLaterInSettings')}
        </p>
      </div>
    </div>
  )
}
