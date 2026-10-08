import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRole } from '../contexts/RoleContext'
import { useLang } from '../contexts/LanguageContext'
import { getTanuTips, TANU_UI } from '../utils/tanuTips'

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

export default function SquirrelMascot() {
  const { role } = useRole()
  const { langCode } = useLang()
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

  // First tip immediately on mount
  useEffect(() => {
    const t = setTimeout(showTip, 300)
    return () => clearTimeout(t)
  }, [showTip])

  // Re-schedule after each dismiss
  useEffect(() => {
    if (!visible) {
      const delay = 45000 + Math.random() * 55000
      nextTimerRef.current = setTimeout(showTip, delay)
    }
    return () => clearTimeout(nextTimerRef.current)
  }, [visible, showTip])

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
