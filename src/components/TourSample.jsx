import { useState } from 'react'
import { FileDown, Printer, Share2, Send, Copy, Users, Calendar, Paperclip } from 'lucide-react'
import { useLang } from '../contexts/LanguageContext'
import { useRole } from '../contexts/RoleContext'
import { tourText } from '../utils/tanuTour'

// Non-working examples shown by Tanu's tour for things that live inside a worksheet or a class.
// The real buttons' labels are reused, and data-tour ids let the tour spotlight one of them.

const Lines = ({ widths }) => (
  <div className="space-y-2">
    {widths.map((w, i) => <div key={i} className="h-2 rounded-full bg-slate-200 dark:bg-slate-700" style={{ width: w }} />)}
  </div>
)

function Badge() {
  const { langCode } = useLang()
  return (
    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-300 text-amber-950 px-2 py-0.5 rounded-full">
      {tourText('tourExample', langCode)}
    </span>
  )
}

function ViewerSample() {
  const { t } = useLang()
  const { role } = useRole()
  const btn = 'flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg'
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/10 bg-white dark:bg-slate-900">
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 px-4 pt-3 pb-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold text-white text-sm truncate">📄 {t('worksheet')}</p>
          <Badge />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          <div className="flex gap-1.5 rounded-lg" data-tour="sample-download">
            <span className={`${btn} bg-white text-violet-700`}><FileDown size={12} /> PDF</span>
            <span className={`${btn} bg-white/15 text-white`}><FileDown size={12} /> Word</span>
            <span className={`${btn} bg-white/15 text-white`}><Printer size={12} /> {t('print')}</span>
          </div>
          {role === 'teacher' && (
            <span className={`${btn} bg-emerald-500 text-white`} data-tour="sample-share"><Share2 size={12} /> {t('share')}</span>
          )}
          {role === 'student' && (
            <span className={`${btn} bg-cyan-500 text-white`} data-tour="sample-submit"><Send size={12} /> {t('submit')}</span>
          )}
        </div>
      </div>
      <div className="p-4">
        <Lines widths={['70%', '95%', '85%', '60%']} />
      </div>
    </div>
  )
}

function ClassSample() {
  const { t } = useLang()
  return (
    <div className="rounded-2xl shadow-2xl ring-1 ring-black/10 bg-white dark:bg-slate-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('classroomCode')}</p>
        <Badge />
      </div>
      <div className="flex items-center gap-2 rounded-xl" data-tour="sample-classcode">
        <span className="flex-1 font-mono font-black text-xl text-center tracking-[0.25em] text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/30 rounded-xl py-2 border-2 border-dashed border-cyan-300 dark:border-cyan-700">
          ABC123
        </span>
        <span className="flex items-center gap-1 text-xs font-semibold px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
          <Copy size={12} /> {t('copy')}
        </span>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-3"><Users size={12} /> {t('studentsCount', { count: 0 })}</p>
    </div>
  )
}

function AssignmentSample() {
  const { t, formatDate } = useLang()
  const [due] = useState(() => formatDate(new Date(Date.now() + 7 * 86400000))) // a week from now
  const field = 'rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-700 dark:text-slate-200'
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/10 bg-white dark:bg-slate-900" data-tour="sample-assignment">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between gap-2">
        <p className="font-bold text-white text-sm">{t('newAssignment')}</p>
        <Badge />
      </div>
      <div className="p-4 space-y-2.5">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 mb-1">{t('titleRequired')}</p>
          <div className={field}>{t('titlePlaceholder')}</div>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-500 mb-1">{t('dueDateOptional')}</p>
          <div className={`${field} flex items-center gap-2 ring-2 ring-blue-400/60`}><Calendar size={12} /> {due}</div>
        </div>
        <div className={`${field} flex items-center gap-2`}><Paperclip size={12} className="text-blue-500" /> {t('attachWorksheet')}</div>
        <div className="flex justify-end">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white">{t('create')}</span>
        </div>
      </div>
    </div>
  )
}

const SAMPLES = { viewer: ViewerSample, class: ClassSample, assignment: AssignmentSample }

export default function TourSample({ type }) {
  const Sample = SAMPLES[type]
  if (!Sample) return null
  // Sits above the blur (z-[46]) so it stays sharp; the spotlight ring (z-[47]) marks one part of it
  return (
    <div className="fixed z-[46] top-20 left-1/2 -translate-x-1/2 w-[min(360px,calc(100vw-24px))] pointer-events-none" aria-hidden="true">
      <Sample />
    </div>
  )
}
