import { createContext, useContext, useState, useCallback, useEffect } from 'react'
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

  /** Translation helper: t('signIn') → localized string */
  const t = useCallback((key) => strings[key] ?? key, [strings])

  return (
    <LanguageContext.Provider value={{ langCode, setLangCode, lang, t }}>
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
