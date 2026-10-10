import { useState, useEffect } from 'react'
import { signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../firebase/config'
import Logo from '../components/Logo'
import { useLang } from '../contexts/LanguageContext'
import { LANGUAGES } from '../utils/languages'

// Opened in the system browser by the Doc Translate desktop app. Signs in with Google here
// (where Google allows it), then hands the Google ID token back to the app via doctranslate://.
// `state` is a one-time random value from the app; the app rejects tokens without its own state.
export default function DesktopAuthPage() {
  const params = new URLSearchParams(window.location.search)
  const state = params.get('state') || ''
  const hl = params.get('hl') || ''
  const validState = /^[A-Za-z0-9_-]{16,128}$/.test(state)
  const [status, setStatus] = useState(validState ? 'ready' : 'invalid')
  const { t, setLangCode } = useLang()

  // Show this page in the language the desktop app is using
  useEffect(() => {
    if (LANGUAGES.some(l => l.code === hl)) setLangCode(hl)
  }, [hl, setLangCode])

  const handleSignIn = async () => {
    setStatus('working')
    try {
      const provider = new GoogleAuthProvider()
      if (hl) provider.setCustomParameters({ hl })
      const result = await signInWithPopup(auth, provider)
      const idToken = GoogleAuthProvider.credentialFromResult(result)?.idToken
      // The browser session isn't needed; the app signs in with the token
      await signOut(auth).catch(() => {})
      if (!idToken) throw new Error('No Google token')
      window.location.href = `doctranslate://auth?state=${encodeURIComponent(state)}&id_token=${encodeURIComponent(idToken)}`
      setStatus('done')
    } catch (err) {
      const code = err?.code || ''
      setStatus(code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request' ? 'ready' : 'error')
    }
  }

  const messages = {
    ready:   [t('desktopReadyTitle'), t('desktopReadyBody')],
    working: [t('desktopWorkingTitle'), t('desktopWorkingBody')],
    done:    [t('desktopDoneTitle'), t('desktopDoneBody')],
    error:   [t('desktopErrorTitle'), t('somethingWentWrong')],
    invalid: [t('desktopInvalidTitle'), t('desktopInvalidBody')],
  }
  const [title, body] = messages[status]

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-violet-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="w-full max-w-sm relative z-10 bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl ring-1 ring-white/10 text-center">
        <div className="flex justify-center mb-4"><Logo size={56} /></div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">{body}</p>
        {(status === 'ready' || status === 'error') && (
          <button onClick={handleSignIn} className="btn-primary w-full">
            {t('continueWithGoogle')}
          </button>
        )}
        {status === 'working' && (
          <div className="w-8 h-8 mx-auto border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    </div>
  )
}
