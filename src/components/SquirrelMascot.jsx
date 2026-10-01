import { useState, useEffect, useRef, useCallback } from 'react'
import { useRole } from '../contexts/RoleContext'

const TIPS = [
  { emoji: '🌸', text: 'Hiragana first! Master all 46 characters and Japanese starts clicking fast.' },
  { emoji: '🎵', text: 'Japanese is phonetic — every character always sounds the same. No exceptions!' },
  { emoji: '🔤', text: 'Katakana is for foreign words. スクール = "school". Can you spot them around you?' },
  { emoji: '🧠', text: 'Review vocabulary right before sleep — your brain locks in memories overnight!' },
  { emoji: '🎌', text: 'です (desu) and ます (masu) make speech polite. Always safe to use them!' },
  { emoji: '🌟', text: 'Kanji radicals are clues! 木 = tree, 森 = forest (three trees). Make sense?' },
  { emoji: '📖', text: 'After you get a translation, try reading the original Japanese version out loud!' },
  { emoji: '💬', text: 'Japanese puts the verb last. "Ringo wo taberu" = "[Apple] [object] eat." Fun flip!' },
  { emoji: '🎯', text: 'は (wa) marks the topic, を (wo) marks the object, に (ni) marks direction. Master these!' },
  { emoji: '🌍', text: 'Japanese borrows tons from English! テレビ = TV, パン = bread. Listen for them!' },
  { emoji: '⭐', text: '3 new words per day = 1,000+ words in a year. Tiny steps, huge results!' },
  { emoji: '📝', text: 'Writing kanji by hand beats typing for memory. Try it just 5 minutes a day!' },
  { emoji: '🎮', text: 'Watch anime with Japanese subtitles — entertainment AND language learning!' },
  { emoji: '🔢', text: 'Numbers in Japanese follow a simple pattern. Once you know 1–10, the rest is easy!' },
  { emoji: '🐿️', text: "You're doing amazing! Every worksheet you complete is one step closer to fluency!" },
]

function SquirrelSVG({ animClass }) {
  return (
    <svg
      width="92" height="102" viewBox="0 0 92 102" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-2xl ${animClass}`}
    >
      {/* ── TAIL (drawn first — sits behind head and body) ── */}
      {/* Outer dark silhouette */}
      <path d="M57,88 C82,70 93,33 74,10 C62,-3 30,1 23,21 C16,38 28,48 40,50 C47,54 53,70 57,88 Z" fill="#8B4D0C"/>
      {/* Main warm layer */}
      <path d="M55,88 C79,69 88,32 69,11 C57,0 32,4 26,23 C20,39 31,47 40,50 C47,54 50,69 55,88 Z" fill="#CC6E1A"/>
      {/* Bright orange highlight */}
      <path d="M52,86 C75,66 83,30 65,13 C54,4 36,8 30,25 C25,40 34,46 40,49 C47,53 48,66 52,86 Z" fill="#EA9438"/>
      {/* Cream fluffy stroke along the outer edge */}
      <path d="M50,82 C72,62 79,28 61,15 C51,7 38,11 33,26 C29,38 36,44 40,48"
            stroke="#F9D488" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.5"/>
      {/* Fluffy tip puff at the very end of the tail */}
      <ellipse cx="69" cy="11" rx="11" ry="7" fill="#F4B85A" transform="rotate(-38 69 11)" opacity="0.75"/>
      <ellipse cx="69" cy="11" rx="6"  ry="4" fill="#FDDFA0" transform="rotate(-38 69 11)" opacity="0.6"/>

      {/* ── BODY ── */}
      <ellipse cx="41" cy="78" rx="20" ry="21" fill="#D57A26"/>
      <ellipse cx="41" cy="81" rx="13" ry="16" fill="#F9DA88"/>

      {/* ── HEAD (large and round) ── */}
      <circle cx="41" cy="43" r="28" fill="#D57A26"/>
      {/* Muzzle / face patch */}
      <ellipse cx="41" cy="50" rx="20" ry="15" fill="#F9DA88"/>

      {/* ── EARS ── */}
      <ellipse cx="19" cy="20" rx="12" ry="14" fill="#D57A26"/>
      <ellipse cx="19" cy="21" rx="7"  ry="9"  fill="#FFB8C8"/>
      <ellipse cx="63" cy="20" rx="12" ry="14" fill="#D57A26"/>
      <ellipse cx="63" cy="21" rx="7"  ry="9"  fill="#FFB8C8"/>

      {/* ── EYES — very large and sparkly ── */}
      {/* Left */}
      <circle cx="29" cy="39" r="11" fill="white"/>
      <circle cx="30.5" cy="40.5" r="7.5" fill="#140300"/>
      <circle cx="33.5" cy="37"   r="3.2" fill="white"/>
      <circle cx="30"   cy="44.5" r="1.5" fill="white"/>
      <circle cx="27.5" cy="38.5" r="0.9" fill="white"/>
      {/* Right */}
      <circle cx="53" cy="39" r="11" fill="white"/>
      <circle cx="54.5" cy="40.5" r="7.5" fill="#140300"/>
      <circle cx="57.5" cy="37"   r="3.2" fill="white"/>
      <circle cx="54"   cy="44.5" r="1.5" fill="white"/>
      <circle cx="51.5" cy="38.5" r="0.9" fill="white"/>

      {/* ── NOSE ── */}
      <ellipse cx="41" cy="51" rx="3.8" ry="3" fill="#E02424"/>
      <ellipse cx="39.8" cy="50.1" rx="1.5" ry="1.1" fill="#FF8888" opacity="0.65"/>

      {/* ── MOUTH (happy W-curve) ── */}
      <path d="M36,55.5 Q39.5,60.5 41,57 Q42.5,60.5 46,55.5"
            stroke="#C01616" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>

      {/* ── ROSY BLUSH ── */}
      <circle cx="15" cy="50" r="9"  fill="#FF5888" opacity="0.28"/>
      <circle cx="67" cy="50" r="9"  fill="#FF5888" opacity="0.28"/>

      {/* ── ARMS ── */}
      <ellipse cx="21" cy="74" rx="10" ry="7" fill="#C96E1A" transform="rotate(-28 21 74)"/>
      <ellipse cx="61" cy="74" rx="10" ry="7" fill="#C96E1A" transform="rotate(28 61 74)"/>

      {/* ── ACORN ── */}
      <ellipse cx="41" cy="95" rx="8"   ry="6"   fill="#7A5206"/>
      <ellipse cx="41" cy="89" rx="10"  ry="4.5" fill="#4A2E06"/>
      <line x1="41" y1="84.5" x2="41" y2="80" stroke="#38220A" strokeWidth="2.4" strokeLinecap="round"/>

      {/* ── SPARKLES ── */}
      {/* Gold 4-point star — top left */}
      <path d="M7,15 L9,9.5 L11,15 L16.5,17 L11,19 L9,24.5 L7,19 L1.5,17 Z" fill="#FBBF24"/>
      {/* Purple small star — upper right */}
      <path d="M76,24 L77.4,20.5 L78.8,24 L82.3,25.4 L78.8,26.8 L77.4,30.3 L76,26.8 L72.5,25.4 Z" fill="#A78BFA"/>
      {/* Tiny blue circles — left side */}
      <circle cx="5"  cy="57" r="3"   fill="#60A5FA" opacity="0.8"/>
      <circle cx="8"  cy="66" r="1.8" fill="#60A5FA" opacity="0.5"/>
      {/* Tiny gold circles — right side */}
      <circle cx="82" cy="54" r="2.5" fill="#FBBF24" opacity="0.75"/>
      <circle cx="80" cy="63" r="1.5" fill="#F59E0B" opacity="0.5"/>
    </svg>
  )
}

export default function SquirrelMascot() {
  const { role } = useRole()
  const [visible, setVisible] = useState(false)
  const [tip, setTip] = useState(TIPS[0])
  const [animClass, setAnimClass] = useState('squeaky-idle')
  const seenRef = useRef(new Set())
  const nextTimerRef = useRef(null)
  const autoDismissRef = useRef(null)

  const getNextTip = useCallback(() => {
    if (seenRef.current.size >= TIPS.length) seenRef.current.clear()
    let idx
    do { idx = Math.floor(Math.random() * TIPS.length) } while (seenRef.current.has(idx))
    seenRef.current.add(idx)
    return TIPS[idx]
  }, [])

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
        <div className="relative bg-white dark:bg-slate-800 rounded-2xl rounded-br-sm shadow-2xl border-2 border-violet-300 dark:border-violet-600 px-3.5 py-3 max-w-[200px]">
          <button
            onClick={dismiss}
            className="absolute -top-2 -right-2 w-5 h-5 bg-violet-100 dark:bg-violet-900 hover:bg-violet-200 dark:hover:bg-violet-800 border border-violet-300 dark:border-violet-600 rounded-full text-violet-500 dark:text-violet-400 text-xs flex items-center justify-center transition-colors"
          >
            ×
          </button>
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
            <span className="mr-1">{tip.emoji}</span>{tip.text}
          </p>
          <p className="text-[10px] text-violet-500 dark:text-violet-400 font-bold mt-1.5">
            — Squeaky 🐿️
          </p>
        </div>
        {/* Pointer triangle */}
        <div className="flex justify-end pr-6">
          <div className="w-3 h-3 bg-white dark:bg-slate-800 border-r-2 border-b-2 border-violet-300 dark:border-violet-600 rotate-45 -mt-[7px]" />
        </div>
      </div>

      {/* Squeaky — click to summon/dismiss */}
      <button
        onClick={() => visible ? dismiss() : showTip()}
        title={visible ? 'Dismiss Squeaky' : 'Ask Squeaky for a tip!'}
        className="select-none"
      >
        <SquirrelSVG animClass={animClass} />
      </button>
    </div>
  )
}
