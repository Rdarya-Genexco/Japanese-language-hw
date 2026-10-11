import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react'
import { useRole } from '../contexts/RoleContext'
import { useLang } from '../contexts/LanguageContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import TourSample from './TourSample'
import { getTanuTips, TANU_UI } from '../utils/tanuTips'
import { getTourSteps, tourText, TOUR_REPLAY_EVENT } from '../utils/tanuTour'

const tourKey = (uid, role) => `tanu-tour-done:${uid}:${role}`

function tourDone(uid, role) {
  try { return localStorage.getItem(tourKey(uid, role)) === '1' } catch { return false }
}
function markTourDone(uid, role, done) {
  try {
    if (done) localStorage.setItem(tourKey(uid, role), '1')
    else localStorage.removeItem(tourKey(uid, role))
  } catch { /* storage unavailable (private mode): the tour just shows again next time */ }
}

// Tanuki — Japanese raccoon dog, iconic folklore creature 🍃
function TanukiSVG({ animClass }) {
  return (
    <svg
      width="94" height="104" viewBox="0 0 94 104" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-2xl ${animClass}`}
    >
      {/* ── TAIL (behind body — striped raccoon tail) ── */}
      <path d="M63,84 C84,76 94,62 86,50 C80,42 68,44 67,52 C66,60 74,64 70,76 C68,82 63,84 63,84 Z" fill="#5A4A10"/>
      <path d="M65,82 C83,73 91,60 83,50 C78,43 70,45 69,53 C68,60 75,63 72,74 C70,80 65,82 65,82 Z" fill="#C8A040"/>
      {/* Stripe marks on tail */}
      <path d="M70,53 Q79,57 82,51" stroke="#5A4A10" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7"/>
      <path d="M69,62 Q78,66 81,60" stroke="#5A4A10" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7"/>
      <path d="M69,71 Q76,74 78,69" stroke="#5A4A10" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7"/>

      {/* ── BODY (very round and chubby — tanuki are famously round!) ── */}
      <ellipse cx="44" cy="74" rx="26" ry="27" fill="#9B7A20"/>
      {/* Big cream belly */}
      <ellipse cx="44" cy="78" rx="18" ry="21" fill="#F6DFA2"/>

      {/* ── HEAD ── */}
      <circle cx="44" cy="42" r="29" fill="#9B7A20"/>

      {/* ── DARK RACCOON EYE PATCHES (tanuki's most iconic feature!) ── */}
      <ellipse cx="30" cy="40" rx="13" ry="11" fill="#2C1A04"/>
      <ellipse cx="58" cy="40" rx="13" ry="11" fill="#2C1A04"/>

      {/* ── EYES — large, bright, inside dark patches ── */}
      {/* Left */}
      <circle cx="30" cy="40" r="9"   fill="white"/>
      <circle cx="31.5" cy="41.5" r="6" fill="#0A0300"/>
      <circle cx="34"   cy="38.5" r="2.8" fill="white"/>
      <circle cx="31"   cy="45.5" r="1.4" fill="white"/>
      <circle cx="29"   cy="39.5" r="0.8" fill="white"/>
      {/* Right */}
      <circle cx="58" cy="40" r="9"   fill="white"/>
      <circle cx="59.5" cy="41.5" r="6" fill="#0A0300"/>
      <circle cx="62"   cy="38.5" r="2.8" fill="white"/>
      <circle cx="59"   cy="45.5" r="1.4" fill="white"/>
      <circle cx="57"   cy="39.5" r="0.8" fill="white"/>

      {/* ── FACE / MUZZLE AREA ── */}
      <ellipse cx="44" cy="53" rx="19" ry="13" fill="#F6DFA2"/>

      {/* ── EARS ── */}
      <ellipse cx="20" cy="18" rx="12" ry="14" fill="#9B7A20"/>
      <ellipse cx="20" cy="19" rx="7.5" ry="9.5" fill="#C9A850"/>
      <ellipse cx="68" cy="18" rx="12" ry="14" fill="#9B7A20"/>
      <ellipse cx="68" cy="19" rx="7.5" ry="9.5" fill="#C9A850"/>

      {/* ── MAGIC LEAF ON HEAD (tanuki's classic prop!) ── */}
      {/* Leaf body — two-tone green */}
      <ellipse cx="44" cy="11" rx="14" ry="9"  fill="#43A047" transform="rotate(-8 44 11)"/>
      <ellipse cx="44" cy="11" rx="10" ry="6.5" fill="#66BB6A" transform="rotate(-8 44 11)"/>
      {/* Leaf veins */}
      <line x1="44" y1="4"  x2="44" y2="20" stroke="#2E7D32" strokeWidth="1.2"/>
      <path d="M36,13 Q44,6 52,13" stroke="#2E7D32" strokeWidth="1" fill="none"/>
      <path d="M38,17 Q44,12 50,17" stroke="#2E7D32" strokeWidth="0.8" fill="none" opacity="0.6"/>
      {/* Leaf stem */}
      <line x1="44" y1="20" x2="44" y2="25" stroke="#5D4037" strokeWidth="2.2" strokeLinecap="round"/>

      {/* ── NOSE ── */}
      <ellipse cx="44" cy="53" rx="4.2" ry="3.2" fill="#1E0E02"/>
      <ellipse cx="42.8" cy="52" rx="1.7" ry="1.2" fill="#7A5030" opacity="0.5"/>

      {/* ── MOUTH (big happy grin) ── */}
      <path d="M39,58 Q44,64 49,58" stroke="#1A0A00" strokeWidth="1.9" strokeLinecap="round" fill="none"/>

      {/* ── BLUSH ── */}
      <circle cx="17" cy="52" r="10" fill="#FF5888" opacity="0.28"/>
      <circle cx="71" cy="52" r="10" fill="#FF5888" opacity="0.28"/>

      {/* ── ARMS ── */}
      <ellipse cx="18" cy="78" rx="11" ry="7.5" fill="#9B7A20" transform="rotate(-25 18 78)"/>
      <ellipse cx="70" cy="78" rx="11" ry="7.5" fill="#9B7A20" transform="rotate(25 70 78)"/>

      {/* ── FEET ── */}
      <ellipse cx="33" cy="98" rx="10" ry="5.5" fill="#7A6010"/>
      <ellipse cx="55" cy="98" rx="10" ry="5.5" fill="#7A6010"/>

      {/* ── SPARKLES ── */}
      {/* Gold star — top left */}
      <path d="M5,22 L7.2,16 L9.4,22 L15.5,24.2 L9.4,26.4 L7.2,32.5 L5,26.4 L-1.1,24.2 Z" fill="#FBBF24"/>
      {/* Purple star — right */}
      <path d="M78,26 L79.5,22 L81,26 L85,27.5 L81,29 L79.5,33 L78,29 L74,27.5 Z" fill="#A78BFA"/>
      {/* Blue dots — left */}
      <circle cx="4"  cy="62" r="3"   fill="#60A5FA" opacity="0.8"/>
      <circle cx="7"  cy="72" r="1.8" fill="#60A5FA" opacity="0.5"/>
      {/* Gold dots — right */}
      <circle cx="85" cy="58" r="2.5" fill="#FBBF24" opacity="0.75"/>
      <circle cx="83" cy="68" r="1.5" fill="#F59E0B" opacity="0.5"/>
    </svg>
  )
}

/** First visible element for any of the data-tour ids, in priority order. */
function findTarget(ids) {
  for (const id of ids) {
    for (const el of document.querySelectorAll(`[data-tour="${id}"]`)) {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) return el
    }
  }
  return null
}

/** Blurs and dims everything except the step's target, which gets a glowing ring. */
function TourSpotlight({ targets }) {
  const [rect, setRect] = useState(null)
  const key = targets.join(',')

  useLayoutEffect(() => {
    if (!key) { setRect(null); return }
    const ids = key.split(',')
    const measure = () => {
      const el = findTarget(ids)
      const r = el?.getBoundingClientRect()
      setRect(prev => {
        if (!r) return null
        const next = { top: r.top, left: r.left, width: r.width, height: r.height }
        return prev && ['top', 'left', 'width', 'height'].every(k => Math.abs(prev[k] - next[k]) < 0.5) ? prev : next
      })
    }
    measure()
    // Layout can still shift (fonts, data loading), so keep the cut-out in place
    const timer = setInterval(measure, 250)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      clearInterval(timer)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [key])

  if (!rect) return null
  const pad = 6
  const top = Math.max(rect.top - pad, 0)
  const left = Math.max(rect.left - pad, 0)
  const bottom = rect.top + rect.height + pad
  const right = rect.left + rect.width + pad
  const panel = 'fixed z-[45] bg-slate-950/45 backdrop-blur-[3px]'
  return (
    <>
      <div className={panel} style={{ top: 0, left: 0, right: 0, height: top }} />
      <div className={panel} style={{ top: bottom, left: 0, right: 0, bottom: 0 }} />
      <div className={panel} style={{ top, left: 0, width: left, height: bottom - top }} />
      <div className={panel} style={{ top, left: right, right: 0, height: bottom - top }} />
      <div
        className="fixed z-[47] rounded-xl ring-4 ring-emerald-400 shadow-[0_0_24px_6px_rgba(52,211,153,0.55)] animate-pulse pointer-events-none"
        style={{ top, left, width: right - left, height: bottom - top }}
      />
    </>
  )
}

export default function SquirrelMascot() {
  const { role } = useRole()
  const { user } = useAuth()
  const { langCode } = useLang()
  const uid = user?.uid
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // First-run tour for both roles; afterwards Tanu stays for students only
  const [tourStep, setTourStep] = useState(null) // null = no tour, else step index
  const steps = useMemo(() => getTourSteps(role, langCode), [role, langCode])
  const inTour = tourStep !== null && steps.length > 0

  useEffect(() => {
    if (!uid || (role !== 'student' && role !== 'teacher')) { setTourStep(null); return }
    setTourStep(tourDone(uid, role) ? null : 0)
  }, [uid, role])

  useEffect(() => {
    const replay = () => { if (uid && role) { markTourDone(uid, role, false); setTourStep(0) } }
    window.addEventListener(TOUR_REPLAY_EVENT, replay)
    return () => window.removeEventListener(TOUR_REPLAY_EVENT, replay)
  }, [uid, role])

  const endTour = useCallback(() => {
    if (uid && role) markTourDone(uid, role, true)
    setTourStep(null)
    if (pathname === '/settings') navigate('/')
  }, [uid, role, pathname, navigate])

  // Open the page the current step is about (e.g. Settings for "log out")
  const stepPage = inTour ? steps[Math.min(tourStep, steps.length - 1)].page : null
  useEffect(() => {
    if (stepPage && stepPage !== pathname) navigate(stepPage)
  }, [stepPage, pathname, navigate])
  const tips = useMemo(() => getTanuTips(langCode), [langCode])
  const ui = TANU_UI[langCode] || TANU_UI.en
  const [visible, setVisible] = useState(false)
  const [tip, setTip] = useState(tips[0])
  const [animClass, setAnimClass] = useState('squeaky-idle')
  const seenRef = useRef(new Set())
  const nextTimerRef = useRef(null)
  const autoDismissRef = useRef(null)

  useEffect(() => { seenRef.current.clear() }, [tips])

  const getNextTip = useCallback(() => {
    if (seenRef.current.size >= tips.length) seenRef.current.clear()
    let idx
    do { idx = Math.floor(Math.random() * tips.length) } while (seenRef.current.has(idx))
    seenRef.current.add(idx)
    return tips[idx]
  }, [tips])

  const showTip = useCallback(() => {
    setTip(getNextTip())
    setVisible(true)
    setAnimClass('squeaky-pop')
    clearTimeout(autoDismissRef.current)
    autoDismissRef.current = setTimeout(() => {
      setVisible(false)
      setAnimClass('squeaky-idle')
    }, 9000)
  }, [getNextTip])

  const dismiss = useCallback(() => {
    clearTimeout(autoDismissRef.current)
    setVisible(false)
    setAnimClass('squeaky-idle')
  }, [])

  // First tip shortly after mount (students only, and not during the tour)
  useEffect(() => {
    if (inTour || role !== 'student') return
    const t = setTimeout(showTip, 300)
    return () => clearTimeout(t)
  }, [showTip, inTour, role])

  // Re-schedule after each dismiss
  useEffect(() => {
    if (!visible && !inTour && role === 'student') {
      const delay = 45000 + Math.random() * 55000
      nextTimerRef.current = setTimeout(showTip, delay)
    }
    return () => clearTimeout(nextTimerRef.current)
  }, [visible, showTip, inTour, role])

  if (inTour) {
    const step = steps[Math.min(tourStep, steps.length - 1)]
    const last = tourStep >= steps.length - 1
    return (
      <>
      <TourSpotlight targets={step.targets} />
      {step.sample && <TourSample type={step.sample} />}
      <div className="fixed bottom-[72px] right-3 z-50 flex flex-col items-end gap-1 md:bottom-4" role="dialog" aria-label={step.title}>
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl rounded-br-md shadow-xl ring-1 ring-emerald-200 dark:ring-emerald-500/40 px-4 py-3 w-[min(300px,calc(100vw-24px))]">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            <span className="mr-1.5">{step.emoji}</span>{step.title}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">{step.text}</p>
          <div className="flex items-center gap-1 mt-3">
            {steps.map((s, i) => (
              <span key={s.key} className={`h-1.5 rounded-full transition-all ${i === tourStep ? 'w-4 bg-emerald-500' : 'w-1.5 bg-slate-200 dark:bg-slate-700'}`} />
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 mt-3">
            {!last ? (
              <button onClick={endTour} className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                {tourText('tourSkip', langCode)}
              </button>
            ) : <span />}
            <div className="flex gap-1.5">
              {tourStep > 0 && (
                <button onClick={() => setTourStep(i => i - 1)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                  {tourText('tourBack', langCode)}
                </button>
              )}
              <button
                onClick={() => last ? endTour() : setTourStep(i => i + 1)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {last ? tourText('tourDone', langCode) : tourText('tourNext', langCode)}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-2">— Tanu 🍃</p>
        </div>
        <div className="flex justify-end pr-6">
          <div className="w-3 h-3 bg-white dark:bg-slate-900 border-r border-b border-emerald-200 dark:border-emerald-500/40 rotate-45 -mt-[7px]" />
        </div>
        <div data-tour="tanu"><TanukiSVG animClass="squeaky-pop" /></div>
      </div>
      </>
    )
  }

  if (role !== 'student') return null

  return (
    <div className="fixed bottom-[72px] right-3 z-40 flex flex-col items-end gap-1 md:bottom-4">
      {/* Tip bubble */}
      <div
        className={`transition-all duration-400 ease-out ${
          visible
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-3 scale-95 pointer-events-none'
        }`}
      >
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl rounded-br-md shadow-xl ring-1 ring-emerald-200 dark:ring-emerald-500/40 px-4 py-3 max-w-[220px]">
          <button
            onClick={dismiss}
            className="absolute -top-2 -right-2 w-6 h-6 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 ring-1 ring-emerald-200 dark:ring-emerald-500/40 shadow-sm rounded-full text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-center transition-colors"
          >
            ×
          </button>
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
            <span className="mr-1">{tip.emoji}</span>{tip.text}
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5">
            — Tanu 🍃
          </p>
        </div>
        {/* Pointer triangle */}
        <div className="flex justify-end pr-6">
          <div className="w-3 h-3 bg-white dark:bg-slate-900 border-r border-b border-emerald-200 dark:border-emerald-500/40 rotate-45 -mt-[7px]" />
        </div>
      </div>

      {/* Tanu — click to summon/dismiss */}
      <button
        onClick={() => visible ? dismiss() : showTip()}
        title={visible ? ui.dismiss : ui.ask}
        className="select-none"
      >
        <TanukiSVG animClass={animClass} />
      </button>
    </div>
  )
}
