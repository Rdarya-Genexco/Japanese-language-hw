import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import { getLang } from '../utils/languages'
import { getStrings } from '../utils/i18n'

const STORAGE_KEY = 'doc-translate-lang'

// Localized page titles shown in the browser tab
const PAGE_TITLES = {
  'en':    'Doc Translate · English',
  'zh-CN': 'Doc Translate · 文档翻译',
  'ja':    'Doc Translate · ワークシート翻訳',
  'fr':    'Doc Translate · Traduction',
  'de':    'Doc Translate · Übersetzung',
  'it':    'Doc Translate · Traduzione',
  'pt':    'Doc Translate · Tradução',
  'es':    'Doc Translate · Traducción',
  'ko':    'Doc Translate · 번역',
  'ru':    'Doc Translate · Перевод',
}

function detectInitialLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return stored
  } catch {}
  return 'ja' // default
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [langCode, setLangCodeState] = useState(detectInitialLang)

  const setLangCode = useCallback((code) => {
    setLangCodeState(code)
    try { localStorage.setItem(STORAGE_KEY, code) } catch {}
  }, [])

  // Update browser tab title whenever language changes
  useEffect(() => {
    document.title = PAGE_TITLES[langCode] ?? 'Doc Translate'
  }, [langCode])

  const lang = getLang(langCode)
  const strings = getStrings(langCode)

  const plural = useMemo(() => new Intl.PluralRules(langCode), [langCode])

  /**
   * t('signIn') → localized string. t('studentsCount', { count: 3 }) picks the language's plural
   * form and fills {count}; any {name} placeholder is filled from the second argument.
   */
  const t = useCallback((key, vars) => {
    let s = strings[key] ?? key
    if (s && typeof s === 'object') s = s[plural.select(vars?.count ?? 0)] ?? s.other ?? s.one
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, name) => (vars[name] ?? m))
    return s
  }, [strings, plural])

  /** Dates in the chosen language. Accepts a Date, epoch ms, or a 'YYYY-MM-DD' due-date string. */
  const formatDate = useCallback((value) => {
    const m = typeof value === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value)
    if (Number.isNaN(d.getTime())) return String(value ?? '')
    return new Intl.DateTimeFormat(langCode, { year: 'numeric', month: 'short', day: 'numeric' }).format(d)
  }, [langCode])

  return (
    <LanguageContext.Provider value={{ langCode, setLangCode, lang, t, formatDate }}>
      {children}
    </LanguageContext.Provider>
  )
}

/** Hook: const { langCode, setLangCode, lang, t } = useLang() */
export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider')
  return ctx
}
