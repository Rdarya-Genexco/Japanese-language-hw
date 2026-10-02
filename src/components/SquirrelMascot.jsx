import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRole } from '../contexts/RoleContext'
import { useLang } from '../contexts/LanguageContext'

const GENERAL_TIPS = [
  { emoji: '🧠', text: 'Review vocabulary right before sleep — your brain locks in memories overnight!' },
  { emoji: '⭐', text: '3 new words per day = 1,000+ words in a year. Tiny steps, huge results!' },
  { emoji: '📖', text: 'After you get a translation, read the original worksheet out loud too. Your ears learn as well as your eyes!' },
  { emoji: '🗣️', text: 'Say new words out loud. Speaking them makes them stick much faster than just reading.' },
  { emoji: '📝', text: 'Writing words by hand beats typing for memory. Try just 5 minutes a day!' },
  { emoji: '🎬', text: "Watch shows with subtitles in the language you're learning — fun AND practice!" },
  { emoji: '🃏', text: 'Put a picture on your flashcards. Linking words to images beats memorising lists.' },
  { emoji: '🔁', text: 'Mistakes are progress! Each one shows you exactly what to practise next.' },
  { emoji: '🦝', text: "You're doing amazing! Every worksheet you complete is one step closer to fluency!" },
]

const LANGUAGE_TIPS = {
  'en': [
    { emoji: '📏', text: 'English spelling is tricky: "though", "through" and "tough" all sound different!' },
    { emoji: '⏳', text: 'Most past tenses add -ed (walk → walked), but common verbs are irregular: go → went.' },
    { emoji: '🔤', text: 'Adjectives come before nouns in English: "a red car", not "a car red".' },
    { emoji: '🧩', text: 'Phrasal verbs change meaning with one small word: "look up", "look after", "look out".' },
  ],
  'zh-CN': [
    { emoji: '🎶', text: 'Mandarin has 4 tones. mā (mother) and mǎ (horse) differ only by tone — say them out loud!' },
    { emoji: '🧩', text: 'Characters are built from pieces: 好 (good) = 女 (woman) + 子 (child).' },
    { emoji: '⏰', text: "Chinese verbs don't change for past or future. Words like 了 (le) and 明天 (tomorrow) do the work." },
    { emoji: '🔤', text: 'Pinyin is your friend: it spells out how each character sounds using Latin letters.' },
  ],
  'ja': [
    { emoji: '🌸', text: 'Hiragana first! Master all 46 characters and Japanese starts clicking fast.' },
    { emoji: '🎯', text: 'は (wa) marks the topic, を (wo) the object, に (ni) the direction. Master these!' },
    { emoji: '💬', text: 'Japanese puts the verb last: "りんごを食べる" = "apple [object] eat".' },
    { emoji: '🌍', text: 'Katakana is for borrowed words: テレビ = TV, パン = bread. Listen for them!' },
  ],
  'fr': [
    { emoji: '🌹', text: 'Every French noun is masculine or feminine. Learn le/la with the word: la table, le livre.' },
    { emoji: '🤫', text: 'Many final letters are silent: "petit" sounds like "puh-tee".' },
    { emoji: '🔗', text: 'Liaison: "les amis" sounds like "lay-zah-mee" — the s joins the next vowel.' },
    { emoji: '👋', text: 'Use "vous" with teachers and adults, "tu" with friends.' },
  ],
  'de': [
    { emoji: '🏗️', text: 'German glues words together: Hand + Schuh = Handschuh (glove, literally "hand shoe")!' },
    { emoji: '🔠', text: 'Every German noun starts with a capital letter: der Hund, die Katze, das Buch.' },
    { emoji: '🎯', text: 'In a main sentence the verb comes second: "Heute spiele ich Fußball."' },
    { emoji: '🎨', text: 'Learn der/die/das with each noun — the article tells you its gender.' },
  ],
  'it': [
    { emoji: '🎵', text: "Italian is read the way it's written. Learn the sounds and you can read almost anything aloud." },
    { emoji: '🍕', text: 'Nouns ending in -o are usually masculine, -a usually feminine: il libro, la pizza.' },
    { emoji: '✌️', text: 'Plurals change the last vowel: libro → libri, pizza → pizze.' },
    { emoji: '👀', text: 'Watch double consonants: "pala" (shovel) vs "palla" (ball) — hold the sound longer!' },
  ],
  'pt': [
    { emoji: '👃', text: 'Portuguese has nasal vowels, often marked with ~: "pão" (bread), "mãe" (mother).' },
    { emoji: '🔀', text: 'Two verbs for "to be": ser for lasting things, estar for temporary ones.' },
    { emoji: '🌎', text: 'Brazilian and European Portuguese sound different, but both are correct!' },
    { emoji: '🍫', text: 'Many words ending in -ção match English "-tion": informação = information.' },
  ],
  'es': [
    { emoji: '🔀', text: 'Two verbs for "to be": ser (what something is) and estar (how or where it is).' },
    { emoji: '🔤', text: 'Spanish is very phonetic: once you know the sounds, you can read most words aloud.' },
    { emoji: '❓', text: 'Questions start with an upside-down mark: ¿Cómo estás?' },
    { emoji: '🌐', text: 'Many English "-tion" words become "-ción": nación, información.' },
  ],
  'ko': [
    { emoji: '🧱', text: 'Hangul has just 24 basic letters, stacked into syllable blocks: ㅎ + ㅏ + ㄴ = 한.' },
    { emoji: '🎯', text: 'Korean puts the verb at the end: "저는 사과를 먹어요" = "I apple eat".' },
    { emoji: '🙇', text: 'Adding 요 (-yo) to the end makes speech polite — perfect for talking to teachers.' },
    { emoji: '🏷️', text: 'Particles mark each word\'s job: 은/는 for the topic, 을/를 for the object.' },
  ],
  'ru': [
    { emoji: '🔡', text: 'Cyrillic has 33 letters. Some look English but sound different: Р = "r", Н = "n".' },
    { emoji: '🧩', text: 'Russian nouns change their ending by role: книга (book) becomes книгу as an object.' },
    { emoji: '🎯', text: 'Stress can fall on any syllable and changes the sound — note it when you learn a word.' },
    { emoji: '✨', text: 'Russian has no words for "the" or "a" — one less thing to remember!' },
  ],
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

export default function SquirrelMascot() {
  const { role } = useRole()
  const { langCode } = useLang()
  const tips = useMemo(() => [...GENERAL_TIPS, ...(LANGUAGE_TIPS[langCode] || [])], [langCode])
  const [visible, setVisible] = useState(false)
  const [tip, setTip] = useState(GENERAL_TIPS[0])
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
        <div className="relative bg-white dark:bg-slate-800 rounded-2xl rounded-br-sm shadow-2xl border-2 border-emerald-300 dark:border-emerald-600 px-3.5 py-3 max-w-[200px]">
          <button
            onClick={dismiss}
            className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-100 dark:bg-emerald-900 hover:bg-emerald-200 dark:hover:bg-emerald-800 border border-emerald-300 dark:border-emerald-600 rounded-full text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-center transition-colors"
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
          <div className="w-3 h-3 bg-white dark:bg-slate-800 border-r-2 border-b-2 border-emerald-300 dark:border-emerald-600 rotate-45 -mt-[7px]" />
        </div>
      </div>

      {/* Tanu — click to summon/dismiss */}
      <button
        onClick={() => visible ? dismiss() : showTip()}
        title={visible ? 'Dismiss Tanu' : 'Ask Tanu for a tip!'}
        className="select-none"
      >
        <TanukiSVG animClass={animClass} />
      </button>
    </div>
  )
}
