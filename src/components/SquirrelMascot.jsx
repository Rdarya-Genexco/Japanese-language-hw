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
      width="68" height="80" viewBox="0 0 68 80" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-xl ${animClass}`}
    >
      {/* Tail — big fluffy curve behind body */}
      <path d="M46 52 Q72 36 66 60 Q62 76 48 70 Q38 64 46 52Z" fill="#A85A18"/>
      <path d="M47 54 Q68 40 64 62 Q60 72 49 68 Q41 63 47 54Z" fill="#D07830"/>
      <path d="M48 57 Q64 46 62 63 Q59 70 50 66 Q44 62 48 57Z" fill="#F0A050"/>

      {/* Body */}
      <ellipse cx="28" cy="57" rx="16" ry="18" fill="#C4721C"/>
      {/* Belly */}
      <ellipse cx="28" cy="60" rx="10" ry="13" fill="#F2C880"/>

      {/* Head */}
      <circle cx="28" cy="26" r="19" fill="#C4721C"/>
      {/* Face patch */}
      <ellipse cx="28" cy="30" rx="13" ry="11" fill="#F2C880"/>

      {/* Left ear */}
      <ellipse cx="12" cy="10" rx="7" ry="8" fill="#C4721C"/>
      <ellipse cx="12" cy="10.5" rx="4" ry="5" fill="#F0A0A0"/>
      {/* Right ear */}
      <ellipse cx="44" cy="10" rx="7" ry="8" fill="#C4721C"/>
      <ellipse cx="44" cy="10.5" rx="4" ry="5" fill="#F0A0A0"/>

      {/* Eyes */}
      <circle cx="20" cy="22" r="5" fill="white"/>
      <circle cx="36" cy="22" r="5" fill="white"/>
      <circle cx="21" cy="22.5" r="3.2" fill="#1a0800"/>
      <circle cx="37" cy="22.5" r="3.2" fill="#1a0800"/>
      {/* Eye shine */}
      <circle cx="22.4" cy="21" r="1.3" fill="white"/>
      <circle cx="38.4" cy="21" r="1.3" fill="white"/>

      {/* Nose */}
      <ellipse cx="28" cy="30.5" rx="2.8" ry="2.2" fill="#D83030"/>
      {/* Mouth */}
      <path d="M25 34 Q28 37.5 31 34" stroke="#B02020" strokeWidth="1.4" strokeLinecap="round" fill="none"/>

      {/* Blush */}
      <ellipse cx="15" cy="29" rx="5" ry="3" fill="#FF7777" opacity="0.3"/>
      <ellipse cx="41" cy="29" rx="5" ry="3" fill="#FF7777" opacity="0.3"/>

      {/* Left arm */}
      <ellipse cx="12" cy="55" rx="6" ry="4.5" fill="#C4721C" transform="rotate(-20 12 55)"/>
      {/* Right arm */}
      <ellipse cx="44" cy="55" rx="6" ry="4.5" fill="#C4721C" transform="rotate(20 44 55)"/>

      {/* Acorn body */}
      <ellipse cx="28" cy="74" rx="6" ry="5" fill="#8B6010"/>
      {/* Acorn cap */}
      <ellipse cx="28" cy="69" rx="7.5" ry="3.5" fill="#4A3008"/>
      {/* Acorn stem */}
      <line x1="28" y1="65.5" x2="28" y2="62" stroke="#3A2406" strokeWidth="2" strokeLinecap="round"/>
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

  // First tip after 15–25s
  useEffect(() => {
    const t = setTimeout(showTip, 15000 + Math.random() * 10000)
    return () => clearTimeout(t)
  }, [showTip])

  // Re-schedule after each dismiss
  useEffect(() => {
    if (!visible) {
      const delay = 45000 + Math.random() * 55000 // 45–100s
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
          {/* Dismiss button */}
          <button
            onClick={dismiss}
            className="absolute -top-2 -right-2 w-5 h-5 bg-violet-100 dark:bg-violet-900 hover:bg-violet-200 dark:hover:bg-violet-800 border border-violet-300 dark:border-violet-600 rounded-full text-violet-500 dark:text-violet-400 text-xs flex items-center justify-center transition-colors"
          >
            ×
          </button>
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
            <span className="mr-1">{tip.emoji}</span>{tip.text}
          </p>
          <p className="text-[10px] text-violet-500 dark:text-violet-400 font-bold mt-1.5 flex items-center gap-1">
            — Squeaky 🐿️
          </p>
        </div>
        {/* Pointer triangle */}
        <div className="flex justify-end pr-6">
          <div className="w-3 h-3 bg-white dark:bg-slate-800 border-r-2 border-b-2 border-violet-300 dark:border-violet-600 rotate-45 -mt-[7px]" />
        </div>
      </div>

      {/* Squirrel — always visible, click to show/dismiss tip */}
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
